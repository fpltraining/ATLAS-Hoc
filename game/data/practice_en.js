/* Bài luyện thực tế (không học thuật, không ngữ pháp):
   - G.READ_TASKS: đọc những thứ gặp thật ngoài đời và ở chỗ làm (biển báo, thực đơn, tin nhắn, lịch xe, email ngắn, nhãn thuốc…).
   - G.FREE_TALK: nói tự do — có người hỏi, bạn tự trả lời bằng câu của mình (không có câu chọn sẵn).
     need: các ý phải có; mỗi ý là danh sách cách nói tương đương (chỉ cần một cách). Máy chấm theo ý, không bắt đúng từng chữ.
     place: gắn với nơi đời sống (để luyện ngay trong lúc nói chuyện); 'work' = tình huống công việc. */
var G = window.G || (window.G = {});

G.READ_TASKS = [
  { kind: 'Biển báo', text: 'CAUTION\nWET FLOOR', q: 'Biển này muốn bạn làm gì?', opts: ['Đi cẩn thận, sàn ướt', 'Không được vào', 'Lau sàn giúp'], ok: 0 },
  { kind: 'Biển ở cửa hàng', text: 'Closed for repairs.\nBack on Monday.', q: 'Khi nào cửa hàng mở lại?', opts: ['Thứ Hai', 'Hôm nay', 'Cuối tuần này'], ok: 0 },
  { kind: 'Biển đỗ xe', text: 'NO PARKING\n8 AM – 6 PM\nMon – Fri', q: 'Bạn đỗ xe ở đây lúc nào thì được?', opts: ['Thứ Bảy', 'Thứ Ba lúc 10 giờ sáng', 'Thứ Sáu lúc 5 giờ chiều'], ok: 0 },
  { kind: 'Thực đơn quán cà phê', text: 'Iced latte .......... $4.50\nHot chocolate ....... $3.75\nBlueberry muffin .... $2.95\n+ Oat milk ........... $0.60', q: 'Một ly iced latte với sữa yến mạch giá bao nhiêu?', opts: ['$5.10', '$4.50', '$3.75'], ok: 0 },
  { kind: 'Tin nhắn của mẹ', text: 'Running late at work. Dinner\'s in the fridge – just heat it up. Back around 8. Love you!', q: 'Mẹ nhắn gì?', opts: ['Mẹ về muộn, con tự hâm đồ ăn trong tủ lạnh', 'Mẹ nhờ con nấu bữa tối', 'Mẹ đi ăn ngoài, con tự mua đồ ăn'], ok: 0 },
  { kind: 'Lịch xe buýt', text: 'BUS 7 – Maple Street\nWeekdays: every 15 min, 6:00 – 22:00\nWeekends: every 30 min, 8:00 – 20:00', q: 'Chủ nhật lúc 7 giờ sáng có xe buýt số 7 không?', opts: ['Không, cuối tuần xe bắt đầu lúc 8 giờ', 'Có, 15 phút một chuyến', 'Có, 30 phút một chuyến'], ok: 0 },
  { kind: 'Nhãn thuốc', text: 'Take 1 tablet twice a day with food.\nDo not take more than 4 tablets in 24 hours.', q: 'Uống thuốc thế nào cho đúng?', opts: ['Một viên, ngày hai lần, uống sau khi ăn', 'Bốn viên mỗi lần', 'Uống lúc đói'], ok: 0 },
  { kind: 'Email ở chỗ làm', text: 'Hi team,\nToday\'s meeting is moved from 2 PM to 3:30 PM. Same room.\nThanks, Linda', q: 'Có gì thay đổi?', opts: ['Cuộc họp dời sang 3 giờ 30 chiều, cùng phòng', 'Cuộc họp bị huỷ', 'Cuộc họp đổi sang phòng khác'], ok: 0 },
  { kind: 'Tin nhắn đồng nghiệp', text: 'Hey, can you cover my shift tomorrow morning? I\'ll take your Saturday. Let me know!', q: 'Đồng nghiệp muốn gì?', opts: ['Nhờ bạn làm thay ca sáng mai, đổi lại họ làm thứ Bảy cho bạn', 'Mời bạn đi chơi thứ Bảy', 'Báo nghỉ làm ngày mai'], ok: 0 },
  { kind: 'Hoá đơn', text: 'Subtotal ..... $18.00\nTax .......... $1.44\nTip .......... $3.00\nTOTAL ........ $22.44', q: 'Bạn trả tiền tip (bo) bao nhiêu?', opts: ['$3.00', '$1.44', '$22.44'], ok: 0 },
  { kind: 'Thông báo ở trường', text: 'The library will close early (3 PM) this Friday for staff training.', q: 'Thứ Sáu này thư viện thế nào?', opts: ['Đóng cửa sớm lúc 3 giờ chiều', 'Mở cửa cả ngày', 'Đóng cửa cả ngày'], ok: 0 },
  { kind: 'Tin nhắn giao hàng', text: 'Your order is out for delivery. Arriving between 2–4 PM. Reply 1 to leave it at the door.', q: 'Muốn người giao để hàng ở cửa thì làm gì?', opts: ['Nhắn lại số 1', 'Gọi điện cho cửa hàng', 'Không cần làm gì'], ok: 0 },
  { kind: 'Biển ở thang máy', text: 'Out of order.\nPlease use the stairs.', q: 'Biển này nghĩa là gì?', opts: ['Thang máy hỏng, đi cầu thang bộ', 'Xếp hàng chờ thang máy', 'Cầu thang đang sửa'], ok: 0 },
  { kind: 'Lịch hẹn', text: 'Reminder: Dentist appointment\nThu, Nov 20 at 9:15 AM\nPlease arrive 10 minutes early.', q: 'Bạn nên có mặt lúc mấy giờ?', opts: ['9 giờ 05', '9 giờ 15', '9 giờ 25'], ok: 0 }
];

G.FREE_TALK = [
  { id: 'cafe-order', place: 'en-cafe', npc: 'leo', sit: 'Ở quán cà phê. Gọi một ly trà sữa đá cỡ lớn và hỏi giá.', q: 'Hi! What can I get for you today?', vi: 'Chào! Hôm nay bạn dùng gì?',
    need: [['milk tea', 'bubble tea', 'tea'], ['iced', 'ice', 'cold'], ['large', 'big'], ['how much', 'price', 'cost']],
    sample: ['Can I get a large iced milk tea? How much is it?', 'Hi, I\'d like a large iced milk tea, please. How much does it cost?'] },
  { id: 'cafe-wrong', place: 'en-cafe', npc: 'leo', sit: 'Bạn gọi đồ uống nóng nhưng nhận ly đá. Nhẹ nhàng nói với nhân viên.', q: 'Here\'s your drink. Enjoy!', vi: 'Đồ uống của bạn đây. Ngon miệng nhé!',
    need: [['sorry', 'excuse me'], ['hot'], ['iced', 'ice', 'cold']],
    sample: ['Sorry, I ordered a hot one, but this is iced.', 'Excuse me, I think I asked for hot, not iced.'] },
  { id: 'market-buy', place: 'en-market', npc: 'rosa', sit: 'Ở chợ. Hỏi mua 1 ký cam và hỏi cam có ngọt không.', q: 'Morning! What are you looking for?', vi: 'Chào cháu! Cháu tìm gì?',
    need: [['orange', 'oranges'], ['kilo', 'kg', 'one kilo', 'a kilo', 'pound'], ['sweet']],
    sample: ['I\'d like a kilo of oranges. Are they sweet?', 'Can I get one kilo of oranges, please? Are they sweet?'] },
  { id: 'doctor', place: 'en-hospital', npc: 'anna', sit: 'Ở phòng khám. Nói với bác sĩ bạn bị đau đầu và sốt từ hôm qua.', q: 'So, what seems to be the problem?', vi: 'Vậy, bạn bị sao?',
    need: [['headache', 'head hurts', 'head'], ['fever', 'hot', 'temperature'], ['yesterday', 'since yesterday', 'two days']],
    sample: ['I have a headache and a fever since yesterday.', 'My head hurts and I\'ve had a fever since yesterday.'] },
  { id: 'mom-late', place: 'en-home', npc: 'mom', sit: 'Mẹ hỏi mấy giờ con về. Bạn có buổi học thêm, về khoảng 6 giờ.', q: 'What time will you be home today?', vi: 'Hôm nay mấy giờ con về?',
    need: [['six', '6'], ['class', 'lesson', 'study', 'practice']],
    sample: ['Around six. I have an extra class today.', 'I\'ll be home at six because I have a class after school.'] },
  { id: 'neighbor-weekend', place: 'en-neighbor', npc: 'ben', sit: 'Ông Ben hỏi cuối tuần bạn làm gì. Kể một việc bạn sẽ làm.', q: 'Got any plans for the weekend?', vi: 'Cuối tuần có kế hoạch gì không?',
    need: [['going to', 'will', 'gonna', 'plan', 'want to', 'i\'m'], ['weekend', 'saturday', 'sunday']],
    sample: ['I\'m going to play football with my friends on Saturday.', 'This weekend I\'ll visit my grandma.'] },
  { id: 'bakery-allergy', place: 'en-bakery', npc: 'mia', sit: 'Ở xe bánh. Bạn bị dị ứng hạt. Hỏi bánh nào không có hạt.', q: 'What would you like this morning?', vi: 'Sáng nay bạn muốn gì?',
    need: [['allergic', 'allergy'], ['nut', 'nuts', 'peanut', 'peanuts'], ['which', 'what', 'any', 'do you have']],
    sample: ['I\'m allergic to nuts. Which ones don\'t have nuts?', 'Do you have anything without nuts? I have a nut allergy.'] },
  { id: 'tourist-direction', place: 'en-tourist', npc: 'carlos', sit: 'Du khách hỏi đường tới bệnh viện. Bảo họ đi thẳng rồi rẽ trái, khoảng 10 phút.', q: 'Sorry, how do I get to the hospital?', vi: 'Xin lỗi, đi tới bệnh viện thế nào?',
    need: [['straight'], ['left'], ['ten', '10'], ['minute', 'minutes']],
    sample: ['Go straight and turn left. It\'s about ten minutes.', 'Walk straight, then turn left. About ten minutes on foot.'] },
  { id: 'gate-late', place: 'en-gate', npc: 'nora', sit: 'Bạn đến trường muộn. Xin lỗi và giải thích lý do (xe buýt đến trễ).', q: 'You\'re late again. What happened?', vi: 'Em lại đến muộn. Có chuyện gì vậy?',
    need: [['sorry'], ['bus'], ['late', 'delayed', 'missed', 'didn\'t come']],
    sample: ['Sorry, the bus was late this morning.', 'I\'m sorry. I missed the bus.'] },
  { id: 'crossing-ask', place: 'en-crossing', npc: 'dan', sit: 'Hỏi chú bảo vệ chỗ qua đường gần nhất ở đâu.', q: 'Need some help, kid?', vi: 'Cần giúp gì không cháu?',
    need: [['where'], ['cross', 'crosswalk', 'crossing']],
    sample: ['Yes, where can I cross the street?', 'Where is the nearest crosswalk?'] },
  { id: 'work-intro', place: 'work', npc: 'nora', sit: 'Ngày đầu đi làm. Giới thiệu tên, công việc và bạn đến từ đâu.', q: 'Welcome! Can you tell us a bit about yourself?', vi: 'Chào mừng! Bạn giới thiệu một chút về mình nhé?',
    need: [['my name', 'i\'m', 'i am', 'name is'], ['from'], ['work', 'job', 'coach', 'teacher', 'manager', 'do']],
    sample: ['Hi, I\'m Han. I\'m from Vietnam and I work as a coach.', 'My name is Han. I\'m from Vietnam. I\'m an esports coach.'] },
  { id: 'work-sick', place: 'work', npc: 'nora', sit: 'Gọi cho quản lý: hôm nay bạn bị ốm, xin nghỉ một ngày.', q: 'Hello, this is Nora. What\'s up?', vi: 'A lô, Nora đây. Có chuyện gì vậy?',
    need: [['sick', 'ill', 'not feeling well', 'fever', 'cold'], ['today'], ['day off', 'can\'t come', 'stay home', 'take', 'off', 'can i']],
    sample: ['Hi Nora, I\'m sick today. Can I take the day off?', 'Sorry, I\'m not feeling well. I can\'t come in today.'] },
  { id: 'work-reschedule', place: 'work', npc: 'nora', sit: 'Xin dời cuộc họp chiều nay sang sáng mai vì bạn bận.', q: 'Are we still meeting at 3 today?', vi: 'Chiều nay 3 giờ mình vẫn họp chứ?',
    need: [['sorry', 'actually', 'unfortunately'], ['tomorrow'], ['morning'], ['move', 'change', 'reschedule', 'can we', 'how about', 'instead']],
    sample: ['Sorry, I\'m busy today. Can we move it to tomorrow morning?', 'Actually, could we reschedule to tomorrow morning?'] },
  { id: 'work-help', place: 'work', npc: 'ben', sit: 'Nhờ đồng nghiệp giúp bạn dùng máy in mới.', q: 'You look a bit confused. Everything okay?', vi: 'Trông bạn hơi bối rối. Ổn không?',
    need: [['help', 'show me', 'can you'], ['printer', 'print']],
    sample: ['Can you help me with the new printer?', 'Could you show me how to use this printer?'] },
  { id: 'shop-return', place: 'work', npc: 'mia', sit: 'Ở cửa hàng: trả lại chiếc áo vì bị chật, bạn có hoá đơn.', q: 'Hi, how can I help you?', vi: 'Chào, tôi giúp gì được bạn?',
    need: [['return', 'exchange', 'give back', 'refund'], ['small', 'tight', 'too small', 'doesn\'t fit'], ['receipt']],
    sample: ['I\'d like to return this shirt. It\'s too small. Here\'s the receipt.', 'Can I exchange this? It doesn\'t fit. I have the receipt.'] },
  { id: 'phone-order', place: 'work', npc: 'leo', sit: 'Gọi điện đặt 2 pizza giao tới nhà, hỏi bao lâu thì tới.', q: 'Thanks for calling Brightford Pizza. What can I get you?', vi: 'Cảm ơn đã gọi Brightford Pizza. Bạn đặt gì?',
    need: [['two', '2'], ['pizza', 'pizzas'], ['deliver', 'delivery', 'to my house', 'address'], ['how long', 'what time', 'when']],
    sample: ['Can I order two pizzas for delivery? How long will it take?', 'I\'d like two pizzas delivered, please. How long is the wait?'] }
];
