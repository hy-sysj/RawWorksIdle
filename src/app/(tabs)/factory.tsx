import { ScreenShell } from '@/components/ScreenShell';

export default function FactoryRoute() {
  return (
    <ScreenShell
      title="공장"
      subtitle="공장 현황과 생산 통계 대시보드 영역입니다."
      body="건물 픽셀 맵, 슬롯 상태, 생산량 통계, 프레스티지 진입 버튼을 배치합니다."
    />
  );
}