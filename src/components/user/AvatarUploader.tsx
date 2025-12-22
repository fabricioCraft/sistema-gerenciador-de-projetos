'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { updateUserAvatar } from '@/actions/user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';

export function AvatarUploader({ user }: { user: any }) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validação Frontend (Segurança Extra)
        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error("A imagem deve ter menos de 5MB");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'kira-upload');
            formData.append('transformation', 'c_fill,g_face,w_400,h_400,q_auto');

            // Envia direto para o Cloudinary (Unsigned)
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData }
            );

            if (!res.ok) {
                const err = await res.json();
                console.error("Cloudinary Error:", err);
                throw new Error('Erro no upload');
            }

            const data = await res.json();

            // Salva o link no Banco de Dados
            await updateUserAvatar(data.secure_url);

            toast.success("Foto de perfil atualizada!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar foto.");
        } finally {
            setIsUploading(false);
        }
    };

    const safeName = user?.fullName || "User";
    const initials = safeName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    const finalAvatarUrl = user?.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${safeName}&backgroundType=gradientLinear`;

    return (
        <div className="relative group w-10 h-10 shrink-0">
            <Avatar className="w-full h-full">
                <AvatarImage src={finalAvatarUrl} alt={safeName} className="object-cover" />
                <AvatarFallback className="bg-indigo-900 text-indigo-100">
                    {initials}
                </AvatarFallback>
            </Avatar>

            {/* Overlay de Upload */}
            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer rounded-full z-10">
                {isUploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                    <Camera className="w-4 h-4 text-white" />
                )}
                <input type="file" hidden accept="image/*" onChange={handleFileChange} disabled={isUploading} />
            </label>
        </div>
    );
}
