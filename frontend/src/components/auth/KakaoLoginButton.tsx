"use client";

// Design Ref: §6 — Supabase Auth (카카오 + 이메일)
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function KakaoLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleKakaoLogin() {
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      toast.error("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleKakaoLogin}
      disabled={isLoading}
      size="lg"
      className="w-full bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] border-none font-medium"
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" />
          연결 중...
        </>
      ) : (
        <>
          <svg
            className="size-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.734 1.811 5.134 4.54 6.489l-.916 3.381a.37.37 0 0 0 .56.399l3.889-2.592c.63.09 1.274.138 1.927.138 5.523 0 10-3.463 10-7.815S17.523 3 12 3z" />
          </svg>
          카카오로 시작하기
        </>
      )}
    </Button>
  );
}
