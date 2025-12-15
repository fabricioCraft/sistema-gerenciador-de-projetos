'use server';

import { db } from '@/db';
import { tasks, projects } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { addHours, max, isBefore, isValid } from 'date-fns';
import { revalidatePath } from 'next/cache';

/**
 * Calculates and updates existing task schedules based on their duration and dependencies.
 * Uses CPM (Critical Path Method) logic:
 * - Start Date = Max(Predecessors.EndDate) || Project.StartDate
 * - End Date = Start Date + Duration
 */
export async function calculateProjectSchedule(projectId: string) {
    console.log(`[Scheduler] Starting calculation for project ${projectId}`);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
        console.error(`[Scheduler] Invalid projectId format: "${projectId}" is not a valid UUID`);
        return { success: false, error: `Invalid projectId format. Expected UUID, got: "${projectId}"` };
    }

    try {
        // 1. Fetch Project to get Start Date (T0)
        const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId));

        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }

        // CRITICAL: Base anchor MUST be project creation or specific start date, NEVER 'new Date()'.
        // This ensures historical timeline is preserved and only gaps are filled relative to the plan.
        const projectStartDate = project.createdAt ? new Date(project.createdAt) : new Date(0); // Fallback to epoch if absolutely nothing found, but never "now".

        // 2. Fetch all tasks for the project
        const projectTasks = await db
            .select()
            .from(tasks)
            .where(eq(tasks.projectId, projectId));

        if (projectTasks.length === 0) {
            return { success: true, message: 'No tasks to schedule' };
        }

        // 3. Build Graph
        const taskMap = new Map<string, typeof projectTasks[0]>();
        const dependentsMap = new Map<string, string[]>();
        const inDegree = new Map<string, number>();

        projectTasks.forEach(task => {
            taskMap.set(task.id, task);
            if (!dependentsMap.has(task.id)) dependentsMap.set(task.id, []);
            inDegree.set(task.id, 0);
        });

        // Populate Graph
        projectTasks.forEach(task => {
            const deps = task.dependencies || [];

            const validDeps = deps.filter(depId => taskMap.has(depId));

            inDegree.set(task.id, validDeps.length);

            validDeps.forEach(depId => {
                if (!dependentsMap.has(depId)) {
                    dependentsMap.set(depId, []);
                }
                dependentsMap.get(depId)!.push(task.id);
            });
        });

        // 4. Topological Sort / Forward Pass
        const queue: string[] = [];

        projectTasks.forEach(task => {
            if ((inDegree.get(task.id) || 0) === 0) {
                queue.push(task.id);
            }
        });

        const updates: { id: string; startDate: Date; endDate: Date }[] = [];

        // Map to store the EFFECTIVE start/end dates used for the calculation.
        // We initialize this with existing dates in DB to respect manual overrides if valid?
        // Actually, during the pass, we will decide for each task if we use existing or calculated.
        const calculatedDates = new Map<string, { start: Date; end: Date }>();

        while (queue.length > 0) {
            const currentTaskId = queue.shift()!;
            const currentTask = taskMap.get(currentTaskId)!;

            // Step A: Determine "Dependency Constraint Start Date"
            // This is the earliest the task CAN start based on physics (dependencies).
            let constraintStartDate = projectStartDate;

            const deps = currentTask.dependencies || [];
            const validDeps = deps.filter(d => taskMap.has(d));

            if (validDeps.length > 0) {
                const dependencyEndDates = validDeps.map(depId => {
                    // We MUST use the dates from the 'calculatedDates' map because those are the "Resolved" dates for this run.
                    // (Whether they were kept from DB or recalculated)
                    return calculatedDates.get(depId)?.end || projectStartDate;
                });

                if (dependencyEndDates.length > 0) {
                    constraintStartDate = dependencyEndDates.reduce((latest, date) => {
                        return isBefore(latest, date) ? date : latest;
                    }, dependencyEndDates[0]);
                }
            }

            // Step B: Determine "Final Start Date"
            // If the task ALREADY has a start date in the DB, we want to respect it (Manual Override / "Permanece dia 12"),
            // UNLESS it violates the dependency constraint (Physics).
            // Logic: Start = Max(ExistingStartDate, ConstraintStartDate).
            // This ensures we never arbitrarily move a task to the past (resetting it to project start), 
            // but we might receive a push to the future if dependencies slip.

            let finalStartDate = constraintStartDate;

            if (currentTask.startDate && isValid(new Date(currentTask.startDate))) {
                const existingStart = new Date(currentTask.startDate);

                // If existing start is AFTER the constraint, we keep it (Slack).
                // If existing start is BEFORE the constraint, we MUST push it (Schedule Slip), 
                // OR we accept the invalid state if we want strict "don't touch".
                // However, "Motor de Agendamento" implies creating a valid schedule.
                // The User Prompt "Permanece dia 12" was in context of "Don't move it to Project Start (Past)".
                // If Existing=12, ProjectStart=1. Constraint=1. Max(12, 1) = 12. Correct.

                if (isBefore(existingStart, constraintStartDate)) {
                    // Violation. Dependencies finish later than this task starts.
                    // We update to constraint.
                    finalStartDate = constraintStartDate;
                } else {
                    // Valid. We respect the existing date.
                    finalStartDate = existingStart;
                }
            } else {
                // No existing date (NULL). We fill the gap using the constraint.
                finalStartDate = constraintStartDate;
            }

            // Step C: Calculate End Date
            // Duration is in hours.
            const durationHours = currentTask.duration || 1;
            const finalEndDate = addHours(finalStartDate, durationHours);

            // Store result in map for dependents
            calculatedDates.set(currentTaskId, { start: finalStartDate, end: finalEndDate });

            // Step D: Decide if we need to update DB
            // We only update if the calculated dates are significantly different from stored, or if stored was null.
            // (Strictly comparing timestamps might be noisy, but safe).

            const needsUpdate =
                !currentTask.startDate ||
                !currentTask.endDate ||
                new Date(currentTask.startDate).getTime() !== finalStartDate.getTime() ||
                new Date(currentTask.endDate).getTime() !== finalEndDate.getTime();

            if (needsUpdate) {
                updates.push({
                    id: currentTaskId,
                    startDate: finalStartDate,
                    endDate: finalEndDate
                });
            }

            // Propagate
            const dependents = dependentsMap.get(currentTaskId) || [];
            dependents.forEach(dependentId => {
                const currentInDegree = inDegree.get(dependentId) || 0;
                const newInDegree = currentInDegree - 1;
                inDegree.set(dependentId, newInDegree);

                if (newInDegree === 0) {
                    queue.push(dependentId);
                }
            });
        }

        // 5. Batch Update
        if (updates.length > 0) {
            await Promise.all(
                updates.map(update =>
                    db.update(tasks)
                        .set({
                            startDate: update.startDate,
                            endDate: update.endDate
                        })
                        .where(eq(tasks.id, update.id))
                )
            );
        }

        console.log(`[Scheduler] Updated ${updates.length} tasks for project ${projectId}`);

        revalidatePath(`/dashboard/${projectId}`);

        return { success: true, updatedCount: updates.length };

    } catch (error) {
        console.error('[Scheduler] Error calculating schedule:', error);
        return { success: false, error: 'Internal Server Error during scheduling' };
    }
}
