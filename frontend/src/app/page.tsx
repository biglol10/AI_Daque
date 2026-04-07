"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, UserRound, Clapperboard } from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "AI 인터뷰",
    description: "AI가 당신의 인생 이야기를 깊이 있게 이끌어냅니다.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: UserRound,
    title: "캐릭터 생성",
    description: "당신만의 캐릭터로 이야기에 생명을 불어넣습니다.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Clapperboard,
    title: "다큐 제작",
    description: "인터뷰와 캐릭터를 엮어 다큐멘터리를 완성합니다.",
    color: "bg-orange-100 text-orange-600",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && user) {
      router.replace("/dashboard");
    }
  }, [user, isInitialized, router]);

  // Don't flash landing page for authenticated users
  if (!isInitialized || user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AI 셀프 다큐멘터리
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          모든 사람의 삶에는 다큐멘터리로 남길 가치가 있다
        </p>
        <Link href="/try" className="mt-8">
          <Button size="lg" className="text-base px-8 py-3 text-lg">
            내 캐릭터 무료로 만들어보기
          </Button>
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          30초면 나를 닮은 귀여운 캐릭터가 만들어져요. 로그인 불필요!
        </p>
      </section>

      {/* Features */}
      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${feature.color}`}
                >
                  <feature.icon className="size-6" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
