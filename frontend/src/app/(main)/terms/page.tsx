export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">이용약관</h1>
      <p className="text-sm text-muted-foreground mb-8">
        시행일: 2026년 4월 1일 | 최종 수정: 2026년 3월 31일
      </p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">

        <section>
          <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
          <p className="text-sm">
            이 약관은 AI 셀프 다큐멘터리(이하 &quot;서비스&quot;)의 이용 조건 및 절차,
            이용자와 서비스 제공자 간의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제2조 (서비스의 내용)</h2>
          <p className="text-sm mb-2">서비스는 다음 기능을 제공합니다.</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>AI 인터뷰를 통한 인생 이야기 수집</li>
            <li>텍스트 템플릿을 통한 인생 이야기 직접 작성</li>
            <li>얼굴 사진 기반 AI 카툰 캐릭터 생성</li>
            <li>인생 시기별 시대배경 AI 이미지 생성</li>
            <li>보이스 클로닝 또는 샘플 음성을 활용한 TTS 나레이션</li>
            <li>이미지 슬라이드쇼 + 나레이션 합성 다큐멘터리 영상 생성</li>
            <li>생성된 영상의 다운로드</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제3조 (회원 가입)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>서비스 이용을 위해서는 회원 가입이 필요합니다.</li>
            <li>이용자는 이메일 또는 카카오 계정으로 가입할 수 있습니다.</li>
            <li>만 14세 미만의 아동은 서비스에 가입할 수 없습니다.</li>
            <li>타인의 정보를 도용하여 가입한 경우 서비스 이용이 제한됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제4조 (이용자의 의무)</h2>
          <p className="text-sm mb-2">이용자는 다음 사항을 준수해야 합니다.</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li><strong>본인 콘텐츠만 사용</strong>: 본인의 얼굴 사진, 본인의 음성, 본인의 이야기만 사용해야 합니다.</li>
            <li><strong>타인 권리 침해 금지</strong>: 타인의 얼굴, 음성, 개인정보를 무단으로 사용할 수 없습니다.</li>
            <li><strong>불법 콘텐츠 금지</strong>: 불법적이거나 유해한 내용을 입력하거나 생성할 수 없습니다.</li>
            <li><strong>서비스 악용 금지</strong>: 비정상적인 방법으로 서비스를 이용하거나 시스템에 부하를 가하는 행위를 할 수 없습니다.</li>
            <li><strong>딥페이크 악용 금지</strong>: 보이스 클로닝, 캐릭터 생성 기능을 사칭, 사기, 허위 정보 유포 등 악의적 목적으로 사용할 수 없습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제5조 (AI 생성 콘텐츠)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>서비스가 생성하는 캐릭터, 배경, 나레이션, 영상은 AI에 의해 자동 생성된 콘텐츠입니다.</li>
            <li>AI 생성 콘텐츠는 실제 사실과 다를 수 있으며, 서비스는 생성된 콘텐츠의 정확성을 보장하지 않습니다.</li>
            <li>시대배경 이미지는 AI가 추정한 것이며 실제 역사적 사실과 차이가 있을 수 있습니다.</li>
            <li>서비스는 부적절한 콘텐츠 생성을 방지하기 위한 안전장치(가드레일)를 운영하며,
                민감한 주제에 대해서는 자동 필터링 또는 주제 전환이 적용될 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제6조 (보이스 클로닝 특칙)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>보이스 클로닝 기능을 사용하려면 별도의 동의 절차가 필요합니다.</li>
            <li>반드시 본인의 음성만 녹음해야 하며, 타인의 음성을 사용하는 것은 엄격히 금지됩니다.</li>
            <li>생성된 클론 음성은 해당 프로젝트의 나레이션에만 사용됩니다.</li>
            <li>이용자는 언제든지 보이스 클로닝 동의를 철회할 수 있으며, 철회 시 클론 음성 데이터는 즉시 삭제됩니다.</li>
            <li>보이스 클로닝으로 생성된 음성을 서비스 외부에서 타인을 사칭하는 데 사용하는 경우 법적 책임은 이용자에게 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제7조 (콘텐츠의 권리)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>이용자가 입력한 인생 이야기, 업로드한 사진의 저작권은 이용자에게 있습니다.</li>
            <li>서비스가 AI로 생성한 캐릭터, 배경, 영상에 대한 이용권은 해당 프로젝트를 생성한 이용자에게 부여됩니다.</li>
            <li>이용자는 생성된 다큐멘터리 영상을 개인적 용도로 자유롭게 사용, 공유, 배포할 수 있습니다.</li>
            <li>서비스는 이용자의 콘텐츠를 AI 모델 학습에 사용하지 않습니다.</li>
            <li>서비스 홍보 목적으로 이용자의 콘텐츠를 사용하고자 할 경우 별도의 동의를 구합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제8조 (서비스의 제한 및 중단)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>서비스는 외부 AI API(OpenAI, ElevenLabs 등)에 의존하며, 외부 서비스 장애 시 일부 기능이 제한될 수 있습니다.</li>
            <li>시스템 점검, 업데이트 시 서비스가 일시 중단될 수 있으며, 사전 공지합니다.</li>
            <li>이용약관을 위반한 이용자에 대해 서비스 이용을 제한할 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제9조 (면책 사항)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>서비스는 AI 생성 콘텐츠의 정확성, 완전성, 적합성을 보장하지 않습니다.</li>
            <li>이용자가 생성한 콘텐츠를 공유/배포함으로써 발생하는 문제에 대해 서비스는 책임지지 않습니다.</li>
            <li>이용자가 타인의 얼굴/음성을 무단 사용하여 발생하는 법적 책임은 이용자에게 있습니다.</li>
            <li>서비스 이용 중 인터뷰 과정에서 이용자가 자발적으로 공유한 개인적 이야기로 인한 심리적 영향에 대해,
                서비스는 상담 서비스를 제공하지 않으며, 필요한 경우 전문 상담 기관 이용을 권장합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제10조 (회원 탈퇴 및 데이터 삭제)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>이용자는 언제든지 회원 탈퇴를 요청할 수 있습니다.</li>
            <li>탈퇴 시 계정 정보, 프로젝트 데이터, 얼굴 사진, 음성 녹음, 생성된 영상이 모두 삭제됩니다.</li>
            <li>삭제된 데이터는 복구할 수 없으며, 탈퇴 전 필요한 영상은 미리 다운로드해야 합니다.</li>
            <li>법령에 따라 보관이 필요한 정보는 해당 법령에서 정한 기간 동안 보관 후 파기합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제11조 (분쟁 해결)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>서비스 이용과 관련한 분쟁은 대한민국 법률을 따릅니다.</li>
            <li>분쟁이 발생할 경우 서비스 제공자의 소재지 관할 법원을 전속 관할로 합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제12조 (약관 변경)</h2>
          <p className="text-sm">
            약관을 변경하는 경우 시행일 7일 전에 서비스 내 공지하며,
            이용자에게 불리한 변경은 30일 전에 공지하고 이메일로 개별 안내합니다.
            변경된 약관에 동의하지 않는 이용자는 회원 탈퇴를 할 수 있습니다.
          </p>
        </section>

      </div>
    </div>
  );
}
