import React from 'react';
import {
  AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Baloo2';
import {loadFont as loadEmoji} from '@remotion/google-fonts/NotoColorEmoji';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['vietnamese', 'latin']});
const {fontFamily: emojiFamily} = loadEmoji();
const FONT = `${fontFamily}, ${emojiFamily}, sans-serif`;
const EMO = `${emojiFamily}, sans-serif`;

const BEAT = (30 * 60) / 124; // khung hình mỗi phách (124 BPM)

/* ---------- tiện ích ---------- */
const useSpring = (delay = 0, damping = 12) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping, mass: 0.8}});
};
const beatPulse = (f: number) => {
  const p = (f % BEAT) / BEAT;
  return 1 + 0.06 * Math.exp(-p * 6);
};

/* ---------- nền động ---------- */
const Cloud: React.FC<{y: number; speed: number; scale: number; offset: number}> = ({y, speed, scale, offset}) => {
  const f = useCurrentFrame();
  const x = ((offset + f * speed) % 2400) - 300;
  return (
    <svg style={{position: 'absolute', left: x, top: y, transform: `scale(${scale})`, opacity: 0.85}} width="260" height="120">
      <ellipse cx="80" cy="75" rx="70" ry="38" fill="white" />
      <ellipse cx="150" cy="55" rx="70" ry="50" fill="white" />
      <ellipse cx="200" cy="80" rx="55" ry="34" fill="white" />
    </svg>
  );
};

const Confetti: React.FC = () => {
  const f = useCurrentFrame();
  const cols = ['#FFD93D', '#FF6B6B', '#6BCB77', '#4D96FF', '#FF8FE5', '#ffffff'];
  return (
    <>
      {new Array(36).fill(0).map((_, i) => {
        const x = (i * 137.5) % 1920;
        const y = ((i * 89 + f * (1.2 + (i % 5) * 0.4)) % 1200) - 60;
        const r = f * (2 + (i % 3)) + i * 40;
        return (
          <div key={i} style={{
            position: 'absolute', left: x + Math.sin((f + i * 20) / 25) * 30, top: y,
            width: 14, height: i % 2 ? 14 : 8, borderRadius: i % 3 ? 3 : 10,
            background: cols[i % cols.length], transform: `rotate(${r}deg)`, opacity: 0.7,
          }} />
        );
      })}
    </>
  );
};

const Background: React.FC<{from: string; to: string}> = ({from, to}) => {
  const f = useCurrentFrame();
  const s = beatPulse(f);
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${from}, ${to})`, overflow: 'hidden'}}>
      <div style={{
        position: 'absolute', right: -120, top: -120, width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,240,150,0.95), rgba(255,200,60,0.5) 55%, transparent 70%)',
        transform: `scale(${s}) rotate(${f}deg)`,
      }} />
      <Cloud y={-10} speed={1.2} scale={0.9} offset={0} />
      <Cloud y={960} speed={0.7} scale={0.7} offset={900} />
      <Cloud y={820} speed={1.0} scale={0.9} offset={1500} />
      <Confetti />
    </AbsoluteFill>
  );
};

/* ---------- khung cảnh có chuyển cảnh ---------- */
const Scene: React.FC<{dur: number; children: React.ReactNode; from: string; to: string}> = ({dur, children, from, to}) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [0, 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4))});
  const outP = interpolate(f, [dur - 10, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wipe = interpolate(f, [0, 16], [0, 140], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{clipPath: `circle(${wipe}% at 50% 50%)`}}>
      <Background from={from} to={to} />
      <AbsoluteFill style={{opacity: outP, transform: `scale(${0.85 + 0.15 * inP}) translateY(${(1 - outP) * -40}px)`}}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Title: React.FC<{text: string; sub?: string; delay?: number; color?: string; size?: number}> = ({text, sub, delay = 0, color = '#fff', size = 84}) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{textAlign: 'center', fontFamily: FONT}}>
      <div style={{fontSize: size, fontWeight: 800, color, lineHeight: 1.1, textShadow: '0 6px 0 rgba(0,0,0,0.25), 0 0 24px rgba(0,0,0,0.25)'}}>
        {words.map((w, i) => {
          const s = spring({frame: f - delay - i * 3, fps: 30, config: {damping: 9}});
          return (
            <span key={i} style={{display: 'inline-block', marginRight: '0.25em', transform: `translateY(${(1 - s) * 80}px) scale(${s})`, opacity: s}}>{w}</span>
          );
        })}
      </div>
      {sub && (
        <div style={{
          fontSize: size * 0.42, fontWeight: 600, color: '#fff', marginTop: 12,
          opacity: interpolate(f, [delay + 12, delay + 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}>{sub}</div>
      )}
    </div>
  );
};

const Card: React.FC<{emoji: string; label: string; desc?: string; delay: number; color: string; w?: number}> = ({emoji, label, desc, delay, color, w = 300}) => {
  const f = useCurrentFrame();
  const s = useSpring(delay, 10);
  const wob = Math.sin((f - delay) / 6) * 6 * Math.max(0, 1 - (f - delay) / 60) + Math.sin(f / 18 + delay) * 3;
  return (
    <div style={{
      width: w, padding: '22px 18px', borderRadius: 32, background: '#fff', textAlign: 'center',
      boxShadow: `0 14px 0 ${color}, 0 24px 40px rgba(0,0,0,0.18)`, fontFamily: FONT,
      transform: `translateY(${(1 - s) * 300}px) scale(${s}) rotate(${(1 - s) * -20}deg)`, opacity: Math.min(1, s * 1.5),
    }}>
      <div style={{fontFamily: EMO, fontSize: 92, transform: `rotate(${wob}deg) scale(${beatPulse(f)})`}}>{emoji}</div>
      <div style={{fontSize: 38, fontWeight: 800, color, lineHeight: 1.1, marginTop: 6}}>{label}</div>
      {desc && <div style={{fontSize: 24, fontWeight: 500, color: '#444', marginTop: 8, lineHeight: 1.25}}>{desc}</div>}
    </div>
  );
};

const Row: React.FC<{children: React.ReactNode; gap?: number; top?: number}> = ({children, gap = 36, top = 0}) => (
  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap, flexWrap: 'wrap', marginTop: top, padding: '0 60px'}}>{children}</div>
);

const Plane: React.FC<{start: number; dur: number; y?: number}> = ({start, dur, y = 160}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  if (p <= 0 || p >= 1) return null;
  const x = -200 + p * 2320;
  const yy = y + Math.sin(p * Math.PI * 2) * 60;
  return (
    <>
      <div style={{position: 'absolute', left: x - 600, top: yy + 52, width: 600, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9))'}} />
      <div style={{position: 'absolute', left: x, top: yy, fontFamily: EMO, fontSize: 110, transform: `rotate(${Math.cos(p * Math.PI * 2) * -12 + 45}deg)`}}>✈️</div>
    </>
  );
};

const Chip: React.FC<{text: string; delay: number; color: string}> = ({text, delay, color}) => {
  const s = useSpring(delay, 9);
  return (
    <div style={{
      fontFamily: FONT, fontSize: 36, fontWeight: 700, color: '#fff', background: color,
      padding: '14px 30px', borderRadius: 60, boxShadow: '0 8px 0 rgba(0,0,0,0.15)',
      transform: `scale(${s}) translateX(${(1 - s) * -200}px)`, opacity: s,
    }}>{text}</div>
  );
};

/* ---------- các cảnh ---------- */
const S1Intro: React.FC = () => {
  const f = useCurrentFrame();
  const badge = useSpring(0, 8);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Plane start={0} dur={110} y={110} />
      <div style={{
        fontFamily: FONT, fontSize: 46, fontWeight: 800, color: '#FF6B6B', background: '#fff',
        padding: '10px 40px', borderRadius: 50, transform: `scale(${badge}) rotate(${-4 + Math.sin(f / 10) * 2}deg)`, marginBottom: 30,
      }}>CHƯƠNG 2</div>
      <Title text="Loại hình du lịch" delay={8} size={120} />
      <Title text="& Sản phẩm du lịch" delay={20} size={100} color="#FFE66D" />
      <div style={{fontFamily: EMO, fontSize: 90, marginTop: 30, letterSpacing: 30, transform: `translateY(${Math.sin(f / 8) * 10}px)`}}>
        {['🏖️', '🗺️', '🎒', '🚢', '🎉'].map((e, i) => {
          const s = spring({frame: f - 40 - i * 5, fps: 30, config: {damping: 8}});
          return <span key={i} style={{display: 'inline-block', transform: `scale(${s})`}}>{e}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const S2KhaiNiem: React.FC = () => {
  const cols = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FF9F1C', '#9B5DE5', '#00BBF9', '#F15BB5'];
  const items = ['📍 Phạm vi, lãnh thổ', '🎯 Mục đích chuyến đi', '⏰ Thời gian', '👥 Hình thức tổ chức', '📝 Phương thức hợp đồng', '🚌 Phương tiện di chuyển', '✨ Tiêu chí khác'];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Title text="Loại hình du lịch là gì?" size={88} />
      <div style={{fontFamily: FONT, fontSize: 38, color: '#fff', fontWeight: 600, maxWidth: 1400, textAlign: 'center', margin: '16px 0 34px', opacity: interpolate(useCurrentFrame(), [15, 30], [0, 1], {extrapolateRight: 'clamp'})}}>
        Cách khai thác nhu cầu, sở thích, thị hiếu… để đáp ứng tốt nhất mong đợi của du khách
      </div>
      <div style={{fontFamily: FONT, fontSize: 40, fontWeight: 800, color: '#FFE66D', marginBottom: 22}}>7 tiêu chí phân loại</div>
      <Row gap={22}>{items.map((t, i) => <Chip key={i} text={t} delay={40 + i * 8} color={cols[i]} />)}</Row>
    </AbsoluteFill>
  );
};

const S3ThuanTuy: React.FC = () => (
  <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
    <Title text="Du lịch thuần túy" sub="Giải trí · nghỉ dưỡng · tham quan · khám phá" size={90} />
    <Row top={50} gap={28}>
      <Card delay={20} emoji="🏯" label="Tham quan" desc="Thưởng ngoạn danh lam thắng cảnh" color="#FF6B6B" w={320} />
      <Card delay={32} emoji="🎡" label="Giải trí" desc="Thư thái, giảm áp lực cuộc sống" color="#4D96FF" w={320} />
      <Card delay={44} emoji="🌴" label="Nghỉ dưỡng" desc="Khí hậu trong lành, phục hồi sức khỏe" color="#6BCB77" w={320} />
      <Card delay={56} emoji="🧗" label="Mạo hiểm" desc="Thử thách, khám phá bản thân" color="#FF9F1C" w={320} />
      <Card delay={68} emoji="🏮" label="Lễ hội" desc="Trải nghiệm lễ hội địa phương" color="#9B5DE5" w={320} />
    </Row>
  </AbsoluteFill>
);

const S4KetHop: React.FC = () => (
  <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
    <Title text="Du lịch kết hợp" sub="Thỏa mãn nhu cầu khác + kết hợp du lịch" size={90} />
    <Row top={44} gap={26}>
      <Card delay={18} emoji="💼" label="Công vụ" color="#4D96FF" w={260} />
      <Card delay={26} emoji="♨️" label="Chữa bệnh" color="#FF6B6B" w={260} />
      <Card delay={34} emoji="👨‍👩‍👧" label="Thăm thân" color="#F15BB5" w={260} />
    </Row>
    <Row top={34} gap={26}>
      <Card delay={42} emoji="⚽" label="Thể thao" color="#6BCB77" w={260} />
      <Card delay={50} emoji="🛕" label="Tôn giáo" color="#FF9F1C" w={260} />
      <Card delay={58} emoji="🌿" label="Sinh thái" color="#00A878" w={260} />
    </Row>
  </AbsoluteFill>
);

const S5Mice: React.FC = () => {
  const f = useCurrentFrame();
  const letters = [
    {l: 'M', t: 'Meetings', v: 'Hội họp', c: '#FF6B6B'},
    {l: 'I', t: 'Incentives', v: 'Khen thưởng', c: '#FF9F1C'},
    {l: 'C', t: 'Conferences', v: 'Hội nghị', c: '#4D96FF'},
    {l: 'E', t: 'Exhibitions', v: 'Triển lãm', c: '#6BCB77'},
  ];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Row gap={24}>
        <Chip text="🌿 Sinh thái: thiên nhiên + giáo dục môi trường" delay={4} color="#00A878" />
        <Chip text="🏛️ Văn hóa: bảo tồn giá trị truyền thống" delay={12} color="#9B5DE5" />
        <Chip text="🏡 Cộng đồng: người dân quản lý & hưởng lợi" delay={20} color="#F15BB5" />
      </Row>
      <div style={{fontFamily: FONT, fontSize: 34, color: '#fff', fontWeight: 600, marginTop: 14, opacity: interpolate(f, [24, 36], [0, 1], {extrapolateRight: 'clamp'})}}>(Luật Du lịch Việt Nam, 2017)</div>
      <div style={{marginTop: 30}}><Title text="Du lịch MICE" delay={34} size={86} color="#FFE66D" /></div>
      <Row top={24} gap={30}>
        {letters.map((x, i) => {
          const s = spring({frame: f - 50 - i * 10, fps: 30, config: {damping: 7}});
          return (
            <div key={i} style={{textAlign: 'center', fontFamily: FONT, transform: `scale(${s}) rotate(${(1 - s) * 180}deg)`}}>
              <div style={{width: 170, height: 170, borderRadius: 40, background: x.c, color: '#fff', fontSize: 120, fontWeight: 800, lineHeight: '180px', boxShadow: '0 12px 0 rgba(0,0,0,0.2)', transform: `scale(${beatPulse(f + i * 4)})`}}>{x.l}</div>
              <div style={{fontSize: 32, fontWeight: 800, color: '#fff', marginTop: 16}}>{x.t}</div>
              <div style={{fontSize: 28, fontWeight: 600, color: '#FFE66D'}}>{x.v}</div>
            </div>
          );
        })}
      </Row>
    </AbsoluteFill>
  );
};

const S6SanPham: React.FC = () => {
  const f = useCurrentFrame();
  const a = useSpring(15, 10), b = useSpring(30, 10), c = useSpring(48, 8);
  const box = (txt: string, emo: string, col: string, s: number) => (
    <div style={{width: 400, padding: 26, borderRadius: 36, background: '#fff', textAlign: 'center', fontFamily: FONT, transform: `scale(${s})`, boxShadow: `0 14px 0 ${col}`}}>
      <div style={{fontFamily: EMO, fontSize: 90}}>{emo}</div>
      <div style={{fontSize: 40, fontWeight: 800, color: col, lineHeight: 1.1}}>{txt}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Title text="Sản phẩm du lịch" sub="Tập hợp các dịch vụ thỏa mãn nhu cầu du khách trong chuyến đi" size={92} />
      <div style={{display: 'flex', alignItems: 'center', gap: 34, marginTop: 44}}>
        {box('Tài nguyên du lịch', '🏞️', '#6BCB77', a)}
        <div style={{fontFamily: FONT, fontSize: 120, fontWeight: 800, color: '#fff', transform: `scale(${b})`}}>+</div>
        {box('Hàng hóa & dịch vụ', '🛎️', '#4D96FF', b)}
        <div style={{fontFamily: FONT, fontSize: 120, fontWeight: 800, color: '#fff', transform: `scale(${c})`}}>=</div>
        <div style={{transform: `scale(${c * beatPulse(f)}) rotate(${Math.sin(f / 10) * 3}deg)`}}>{box('Sản phẩm du lịch', '🎁', '#FF6B6B', 1)}</div>
      </div>
      <Row top={40} gap={22}>
        <Chip text="⭐ Thành phần thu hút" delay={70} color="#FF9F1C" />
        <Chip text="🏨 Cơ sở du lịch" delay={80} color="#9B5DE5" />
        <Chip text="🤝 Dịch vụ du lịch" delay={90} color="#00BBF9" />
      </Row>
    </AbsoluteFill>
  );
};

const S7DacThu: React.FC = () => (
  <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
    <Title text="5 đặc thù của sản phẩm du lịch" size={80} />
    <Row top={50} gap={26}>
      <Card delay={16} emoji="👻" label="Vô hình" desc="Không kiểm tra trước khi mua" color="#9B5DE5" w={320} />
      <Card delay={30} emoji="🎲" label="Không đồng nhất" desc="Chất lượng thay đổi theo người, lúc, nơi" color="#FF6B6B" w={320} />
      <Card delay={44} emoji="🔄" label="Đồng thời" desc="Sản xuất & tiêu dùng cùng lúc, cùng nơi" color="#4D96FF" w={320} />
      <Card delay={58} emoji="📅" label="Thời vụ" desc="Cầu biến động, cung ổn định" color="#FF9F1C" w={320} />
      <Card delay={72} emoji="⌛" label="Không lưu trữ" desc="Không thể sản xuất trước, lưu kho" color="#00A878" w={320} />
    </Row>
  </AbsoluteFill>
);

const S8MoHinh: React.FC = () => {
  const f = useCurrentFrame();
  const col = (title: string, color: string, items: string[], delay: number) => {
    const s = spring({frame: f - delay, fps: 30, config: {damping: 10}});
    return (
      <div style={{width: 500, borderRadius: 40, background: '#fff', padding: '24px 26px', fontFamily: FONT, boxShadow: `0 14px 0 ${color}`, transform: `translateY(${(1 - s) * 400}px) rotate(${(1 - s) * 15}deg)`}}>
        <div style={{fontSize: 96, fontWeight: 800, color, textAlign: 'center', lineHeight: 1, transform: `scale(${beatPulse(f + delay)})`}}>{title}</div>
        {items.map((it, i) => {
          const o = interpolate(f, [delay + 12 + i * 5, delay + 20 + i * 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return <div key={i} style={{fontSize: 29, fontWeight: 600, color: '#333', marginTop: 6, opacity: o, transform: `translateX(${(1 - o) * 40}px)`}}>{it}</div>;
        })}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Title text="Mô hình sản phẩm du lịch" size={80} />
      <div style={{display: 'flex', gap: 36, marginTop: 40, alignItems: 'flex-start'}}>
        {col('4S', '#00BBF9', ['🌊 Sea – Biển', '☀️ Sun – Mặt trời', '🏖️ Sand – Bãi cát', '🛍️ Shop – Mua sắm'], 14)}
        {col('3H', '#FF6B6B', ['🏛️ Heritage – Di sản', '🤗 Hospitality – Hiếu khách', '✅ Honesty – Trung thực'], 30)}
        {col('6S', '#6BCB77', ['🧼 Vệ sinh  · 💪 Sức khỏe', '🛡️ An ninh · 🧘 Thanh thản', '🛎️ Dịch vụ · 😊 Hài lòng'], 46)}
      </div>
    </AbsoluteFill>
  );
};

const S9Outro: React.FC = () => {
  const f = useCurrentFrame();
  const s = useSpring(4, 7);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Plane start={0} dur={80} y={700} />
      <div style={{fontFamily: EMO, fontSize: 150, transform: `scale(${s}) rotate(${Math.sin(f / 6) * 10}deg)`}}>🌏</div>
      <Title text="Xách ba lô lên và đi!" delay={6} size={110} color="#FFE66D" />
      <Title text="Cảm ơn các bạn đã theo dõi 💖" delay={18} size={60} />
    </AbsoluteFill>
  );
};

/* ---------- dòng thời gian (30 fps, 60 giây) ---------- */
const TIMELINE: {from: number; dur: number; C: React.FC; bg: [string, string]}[] = [
  {from: 0, dur: 150, C: S1Intro, bg: ['#00C9FF', '#92FE9D']},
  {from: 150, dur: 210, C: S2KhaiNiem, bg: ['#FF9A8B', '#FF6A88']},
  {from: 360, dur: 270, C: S3ThuanTuy, bg: ['#43C6AC', '#191654']},
  {from: 630, dur: 240, C: S4KetHop, bg: ['#F7971E', '#FFD200']},
  {from: 870, dur: 240, C: S5Mice, bg: ['#7F7FD5', '#86A8E7']},
  {from: 1110, dur: 210, C: S6SanPham, bg: ['#11998E', '#38EF7D']},
  {from: 1320, dur: 210, C: S7DacThu, bg: ['#FC466B', '#3F5EFB']},
  {from: 1530, dur: 180, C: S8MoHinh, bg: ['#00B4DB', '#0083B0']},
  {from: 1710, dur: 90, C: S9Outro, bg: ['#FF5F6D', '#FFC371']},
];

const ProgressBar: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, bottom: 0, height: 12, width: `${(f / 1800) * 100}%`, background: 'linear-gradient(90deg,#FFE66D,#FF6B6B,#4D96FF)'}}>
      <div style={{position: 'absolute', right: -26, top: -40, fontFamily: EMO, fontSize: 44}}>🧳</div>
    </div>
  );
};

export const Video: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Audio src={staticFile('nhac-nen.mp3')} volume={(f) => interpolate(f, [0, 15, 1740, 1800], [0, 0.9, 0.9, 0], {extrapolateRight: 'clamp'})} />
    {TIMELINE.map(({from, dur, C, bg}, i) => (
      <Sequence key={i} from={from} durationInFrames={dur}>
        <Scene dur={dur} from={bg[0]} to={bg[1]}><C /></Scene>
      </Sequence>
    ))}
    <ProgressBar />
  </AbsoluteFill>
);
