"use client";

// Design Ref: §2.1 — profiles table, §3.2 ProfileForm
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { Profile } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  display_name: z
    .string()
    .min(1, "이름을 입력해주세요")
    .max(50, "이름은 50자 이하로 입력해주세요"),
  birth_year: z
    .number()
    .int()
    .min(1940, "1940년 이후로 입력해주세요")
    .max(2010, "2010년 이전으로 입력해주세요"),
  gender: z.enum(["male", "female", "other"], {
    message: "성별을 선택해주세요",
  }),
});

export function ProfileForm() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    display_name?: string;
    birth_year?: string;
    gender?: string;
  }>({});

  const isNewUser = !profile;

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBirthYear(profile.birth_year?.toString() || "");
      setGender(profile.gender || "");
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = profileSchema.safeParse({
      display_name: displayName.trim(),
      birth_year: birthYear ? Number(birthYear) : undefined,
      gender: gender || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: {
        display_name?: string;
        birth_year?: string;
        gender?: string;
      } = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as
          | "display_name"
          | "birth_year"
          | "gender";
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);

    const profileData = {
      id: user.id,
      display_name: parsed.data.display_name,
      birth_year: parsed.data.birth_year,
      gender: parsed.data.gender,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "id" })
      .select("id, display_name, birth_year, gender, avatar_url")
      .single();

    setIsLoading(false);

    if (error) {
      toast.error("프로필 저장에 실패했습니다. 다시 시도해주세요.");
      return;
    }

    setProfile(data as Profile);

    if (isNewUser) {
      toast.success("프로필이 설정되었습니다.");
      router.push("/dashboard");
    } else {
      toast.success("프로필이 업데이트되었습니다.");
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>프로필 설정</CardTitle>
        <CardDescription>
          {isNewUser
            ? "프로필을 설정해주세요"
            : "프로필 정보를 수정할 수 있습니다"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display_name">이름</Label>
            <Input
              id="display_name"
              type="text"
              placeholder="이름을 입력해주세요"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-invalid={!!errors.display_name}
              disabled={isLoading}
            />
            {errors.display_name && (
              <p className="text-sm text-destructive">{errors.display_name}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birth_year">생년</Label>
            <Input
              id="birth_year"
              type="number"
              placeholder="예: 1990"
              min={1940}
              max={2010}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              aria-invalid={!!errors.birth_year}
              disabled={isLoading}
            />
            {errors.birth_year && (
              <p className="text-sm text-destructive">{errors.birth_year}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gender">성별</Label>
            <Select value={gender} onValueChange={(value) => setGender(value ?? "")}>
              <SelectTrigger className="w-full" aria-invalid={!!errors.gender}>
                <SelectValue placeholder="성별을 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">남성</SelectItem>
                <SelectItem value="female">여성</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                저장 중...
              </>
            ) : isNewUser ? (
              "프로필 설정 완료"
            ) : (
              "프로필 수정"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
