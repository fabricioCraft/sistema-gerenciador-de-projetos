export type Task = {
    id: string;
    title: string;
    duration: number; // in hours
    dependencies: string[]; // IDs
    // Calculated fields
    startDate?: Date;
    endDate?: Date;
    isCritical?: boolean;
    slack?: number;
};

export function calculateSchedule(tasks: Task[]): Task[] {
    // 1. Map ID to Task
    const taskMap = new Map<string, Task>();
    const dependentsMap = new Map<string, string[]>(); // Who depends on me?

    tasks.forEach(task => {
        taskMap.set(task.id, { ...task });
        if (!dependentsMap.has(task.id)) dependentsMap.set(task.id, []);
    });

    tasks.forEach(task => {
        task.dependencies.forEach(depId => {
            if (dependentsMap.has(depId)) {
                dependentsMap.get(depId)!.push(task.id);
            }
        });
    });

    // 2. Forward Pass (Early Start / Early Finish)
    // We work in "hours from project start".
    const earlyStart = new Map<string, number>();
    const earlyFinish = new Map<string, number>();

    // Topological sort or simple iterative approach until convergence for Forward Pass
    // Since it's a DAG, we can find tasks with 0 dependencies processed.
    // Or just iterate: ES = max(EF of dependencies). Start with 0 for no deps.

    // Simple implementation: Queue of tasks whose dependencies have been processed.
    // Actually, simple DFS with memoization or iterative level-based.

    // Let's use simple iterative with loop detection protection.
    let changed = true;
    let iterations = 0;
    while (changed && iterations < tasks.length * 2) {
        changed = false;
        tasks.forEach(task => {
            let maxDepEF = 0;
            task.dependencies.forEach(depId => {
                const ef = earlyFinish.get(depId) || 0;
                if (ef > maxDepEF) maxDepEF = ef;
            });

            const currentES = earlyStart.get(task.id);
            if (currentES !== maxDepEF) {
                earlyStart.set(task.id, maxDepEF);
                earlyFinish.set(task.id, maxDepEF + task.duration);
                changed = true;
            } else if (!earlyFinish.has(task.id)) {
                earlyFinish.set(task.id, maxDepEF + task.duration);
                changed = true;
            }
        });
        iterations++;
    }

    // Project Duration
    let projectDuration = 0;
    earlyFinish.forEach(ef => {
        if (ef > projectDuration) projectDuration = ef;
    });

    // 3. Backward Pass (Late Start / Late Finish)
    const lateStart = new Map<string, number>();
    const lateFinish = new Map<string, number>();

    // Initialize LF of all tasks to Project Duration (or max of dependents?)
    tasks.forEach(task => {
        lateFinish.set(task.id, projectDuration);
        lateStart.set(task.id, projectDuration - task.duration);
    });

    // Iterate backwards
    changed = true;
    iterations = 0;
    while (changed && iterations < tasks.length * 2) {
        changed = false;
        tasks.forEach(task => {
            // LF = min(LS of dependents). If no dependents, LF = ProjectDuration.
            const dependents = dependentsMap.get(task.id) || [];
            let minDepLS = projectDuration;

            if (dependents.length > 0) {
                minDepLS = Number.MAX_SAFE_INTEGER;
                dependents.forEach(depId => {
                    const ls = lateStart.get(depId);
                    if (ls !== undefined && ls < minDepLS) minDepLS = ls;
                });
                if (minDepLS === Number.MAX_SAFE_INTEGER) minDepLS = projectDuration;
            }

            const currentLF = lateFinish.get(task.id);
            if (currentLF !== minDepLS) {
                lateFinish.set(task.id, minDepLS);
                lateStart.set(task.id, minDepLS - task.duration);
                changed = true;
            }
        });
        iterations++;
    }

    // 4. Calculate Dates and Critical Path
    const today = new Date();
    today.setHours(8, 0, 0, 0); // Start at 8 AM today

    return tasks.map(task => {
        const es = earlyStart.get(task.id) || 0;
        const ef = earlyFinish.get(task.id) || 0;
        const ls = lateStart.get(task.id) || 0;

        const slack = ls - es;
        const isCritical = slack <= 0.001; // Float precision

        // Convert hours to Dates (assuming 8h workday? Or 24h? PRD simple "hours")
        // Getting simple: Add hours directly to date.

        const startDate = new Date(today.getTime() + es * 3600000);
        const endDate = new Date(today.getTime() + ef * 3600000);

        return {
            ...task,
            startDate,
            endDate,
            isCritical,
            slack
        };
    });
}
