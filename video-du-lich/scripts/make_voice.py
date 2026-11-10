# Tạo lồng tiếng tiếng Việt (Edge TTS – vi-VN-HoaiMyNeural), tự tăng tốc độ để vừa khung cảnh.
import asyncio, json, os, subprocess, sys
import edge_tts
VOICE = 'vi-VN-HoaiMyNeural'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/voice'
PROXY = os.environ.get('HTTPS_PROXY')
# (tên, thời lượng cảnh tính bằng giây, lời dẫn)
LINES = [
  ('s1', 5, 'Chào mừng các bạn đến với Chương hai: Loại hình du lịch và sản phẩm du lịch!'),
  ('s2', 7, 'Loại hình du lịch là cách khai thác nhu cầu, sở thích của du khách. Có bảy tiêu chí để phân loại.'),
  ('s3', 9, 'Du lịch thuần túy gồm: tham quan, giải trí, nghỉ dưỡng, mạo hiểm và lễ hội. Chỉ để vui chơi, khám phá!'),
  ('s4', 8, 'Du lịch kết hợp: đi công vụ, chữa bệnh, thăm thân, thể thao, tôn giáo hay sinh thái, mà vẫn được du lịch.'),
  ('s5', 8, 'Còn có du lịch văn hóa, du lịch cộng đồng, và MICE: hội họp, khen thưởng, hội nghị, triển lãm.'),
  ('s6', 7, 'Sản phẩm du lịch bằng tài nguyên du lịch, cộng với hàng hóa và dịch vụ du lịch.'),
  ('s7', 7, 'Năm đặc thù: vô hình, không đồng nhất, đồng thời, thời vụ, và không thể lưu trữ.'),
  ('s8', 6, 'Ba mô hình nổi bật: bốn S, ba H và sáu S.'),
  ('s9', 3, 'Xách ba lô lên và đi thôi!'),
]
def dur(p):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p]).strip())
async def main():
    os.makedirs(OUT, exist_ok=True); meta = {}
    for name, scene, text in LINES:
        target = scene - 0.9  # chừa đầu/cuối cảnh
        rate = 5
        while True:
            p = f'{OUT}/{name}.mp3'
            for attempt in range(5):
                try:
                    await edge_tts.Communicate(text, VOICE, rate=f'+{rate}%', proxy=PROXY).save(p); break
                except Exception as e:
                    print('  thử lại', name, type(e).__name__); await asyncio.sleep(2 * (attempt + 1))
            else:
                raise SystemExit('Không tạo được ' + name)
            d = dur(p)
            if d <= target or rate >= 45: break
            rate += 5
        meta[name] = round(d, 2); print(name, f'rate+{rate}%', round(d, 2), '/', target)
    json.dump(meta, open(f'{OUT}/durations.json', 'w'), indent=1)
asyncio.run(main())
