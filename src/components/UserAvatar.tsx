import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
    name?: string | null;
    avatarUrl?: string | null;
    className?: string;
}

export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
    // Fallback seguro se não vier nome
    const safeName = name || "User";
    const initials = safeName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    // Se não tiver avatarUrl no banco, gera um DiceBear on-the-fly como backup final
    const finalAvatarUrl = avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${safeName}&backgroundType=gradientLinear`;

    return (
        <Avatar className={className}>
            <AvatarImage src={finalAvatarUrl} alt={safeName} />
            <AvatarFallback className="bg-indigo-900 text-indigo-100">
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}
