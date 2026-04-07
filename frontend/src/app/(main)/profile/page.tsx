"use client";

// Design Ref: §2.1 — profiles table, §3.2 ProfileForm
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      <ProfileForm />
    </div>
  );
}
