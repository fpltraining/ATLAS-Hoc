/* "Sau giờ học": 6 nơi đời sống thật ở trung tâm Brightford.
   Siêu thị mini · Hiệu thuốc · Ngân hàng · Bưu điện · Tiệm cắt tóc · Phòng gym.
   Mỗi nơi 3 tình huống × 5 lượt + 1 câu "Nói tự do". Nhân vật ghép từ lớp hình có sẵn, quầy vẽ bằng code. */
var G = window.G || (window.G = {});

(function () {
  var N = G.NPC_MORE || (G.NPC_MORE = {});
  N.ray = { img: 'npc_ray.png', name: 'Ray', av: { ao: 'uniform', mat: 'cool', toc: 'messy', mauToc: '#2a2220' }, role: 'Thu ngân siêu thị' };
  N.lee = { img: 'npc_lee.png', name: 'Ms. Lee', av: { ao: 'uniform', mat: 'calm', toc: 'long', mauToc: '#5b3a29' }, role: 'Dược sĩ' };
  N.grant = { img: 'npc_grant.png', name: 'Mr. Grant', av: { ao: 'jacket', mat: 'calm', toc: 'sidepart', mauToc: '#8a5a3b' }, role: 'Nhân viên ngân hàng' };
  N.ivy = { img: 'npc_ivy.png', name: 'Ivy', av: { ao: 'sweater', mat: 'smile', toc: 'curly', mauToc: '#c8553d' }, role: 'Nhân viên bưu điện' };
  N.tony = { img: 'npc_tony.png', name: 'Tony', av: { ao: 'tech', mat: 'wink', toc: 'spiky', mauToc: '#2a2220' }, role: 'Thợ cắt tóc' };
  N.max = { img: 'npc_max.png', name: 'Coach Max', av: { ao: 'sport', mat: 'smile', toc: 'bowl', mauToc: '#c9893e' }, role: 'Huấn luyện viên phòng gym' };

  var L = G.LIFE || (G.LIFE = {});
  L['en-super'] = {
    lang: 'en', title: 'Siêu thị mini', npc: 'ray', after: 1,
    talks: [
      { title: 'Tìm đồ', turns: [
        { npc: 'Hi, can I help you find anything?', vi: 'Chào, bạn cần tìm gì không?', ok: 'Yes, where can I find the milk?' },
        { npc: 'It\'s in aisle three, next to the eggs.', vi: 'Ở dãy số ba, cạnh chỗ trứng.', ok: 'Thanks. Do you have oat milk too?' },
        { npc: 'We do, but we\'re out of the big ones.', vi: 'Có, nhưng hết loại hộp lớn rồi.', ok: 'That\'s okay, I\'ll take a small one.' },
        { npc: 'Anything else you\'re looking for?', vi: 'Bạn còn tìm gì nữa không?', ok: 'Where\'s the bread?' },
        { npc: 'Right at the end of aisle one.', vi: 'Ở cuối dãy số một.', ok: 'Great, thank you.' }
      ] },
      { title: 'Tính tiền', turns: [
        { npc: 'Did you find everything okay?', vi: 'Bạn tìm đủ đồ chưa?', ok: 'Yes, thanks.' },
        { npc: 'Do you need a bag? It\'s ten cents.', vi: 'Bạn cần túi không? Mười xu một cái.', ok: 'No, I brought my own bag.' },
        { npc: 'Great. That comes to twelve forty.', vi: 'Tốt quá. Tổng cộng mười hai đô bốn mươi.', ok: 'Can I pay with my phone?' },
        { npc: 'Sure, go ahead.', vi: 'Được, bạn quét đi.', ok: 'Okay... done.' },
        { npc: 'Here\'s your receipt. Have a nice evening!', vi: 'Hoá đơn của bạn đây. Buổi tối vui vẻ!', ok: 'You too!' }
      ] },
      { title: 'Đổi hàng bị hỏng', turns: [
        { npc: 'Hi, what can I do for you?', vi: 'Chào, tôi giúp gì được bạn?', ok: 'I bought these eggs yesterday, but two are broken.' },
        { npc: 'Oh, I\'m sorry about that. Do you have the receipt?', vi: 'Ôi, xin lỗi bạn. Bạn có hoá đơn không?', ok: 'Yes, here it is.' },
        { npc: 'Would you like a refund or a new box?', vi: 'Bạn muốn hoàn tiền hay lấy hộp mới?', ok: 'A new box, please.' },
        { npc: 'Go ahead and grab one from aisle three.', vi: 'Bạn cứ ra dãy ba lấy một hộp nhé.', ok: 'Thanks. That was easy.' },
        { npc: 'Sorry again for the trouble.', vi: 'Xin lỗi lần nữa vì phiền bạn.', ok: 'No worries.' }
      ] }
    ]
  };
  L['en-pharmacy'] = {
    lang: 'en', title: 'Hiệu thuốc', npc: 'lee', after: 2,
    talks: [
      { title: 'Mua thuốc cảm', turns: [
        { npc: 'Hi, how can I help?', vi: 'Chào, tôi giúp gì được bạn?', ok: 'I have a cold. Do you have anything for it?' },
        { npc: 'Sure. Do you have a fever or just a runny nose?', vi: 'Có chứ. Bạn có sốt không hay chỉ sổ mũi?', ok: 'Just a runny nose and a sore throat.' },
        { npc: 'Try these tablets. Take one every six hours.', vi: 'Thử loại viên này nhé. Sáu tiếng uống một viên.', ok: 'Can I take them with food?' },
        { npc: 'Yes, it\'s better with food.', vi: 'Được, uống sau khi ăn thì tốt hơn.', ok: 'Okay. How much are they?' },
        { npc: 'Seven ninety-nine.', vi: 'Bảy đô chín mươi chín.', ok: 'Here you go. Thanks.' }
      ] },
      { title: 'Lấy thuốc theo đơn', turns: [
        { npc: 'Hello. Are you picking up a prescription?', vi: 'Chào bạn. Bạn tới lấy thuốc theo đơn hả?', ok: 'Yes, it\'s for my mom.' },
        { npc: 'What\'s her name?', vi: 'Mẹ bạn tên gì?', ok: 'Linh Nguyen.' },
        { npc: 'Got it. It\'ll be ready in ten minutes.', vi: 'Được rồi. Mười phút nữa là có.', ok: 'Okay, I\'ll wait here.' },
        { npc: 'Make sure she takes it twice a day.', vi: 'Nhớ nhắc mẹ uống ngày hai lần nhé.', ok: 'Twice a day. Got it.' },
        { npc: 'Here you go. I hope she feels better soon.', vi: 'Thuốc đây. Mong mẹ bạn sớm khoẻ.', ok: 'Thank you so much.' }
      ] },
      { title: 'Bị dị ứng', turns: [
        { npc: 'Can I help you find something?', vi: 'Bạn cần tìm gì không?', ok: 'I think I\'m allergic to something. My eyes are itchy.' },
        { npc: 'Is it worse when you\'re outside?', vi: 'Ra ngoài trời có nặng hơn không?', ok: 'Yeah, especially in the morning.' },
        { npc: 'It might be pollen. These allergy pills can help.', vi: 'Có thể do phấn hoa. Thuốc dị ứng này sẽ đỡ.', ok: 'Will they make me sleepy?' },
        { npc: 'No, these ones won\'t.', vi: 'Không, loại này không gây buồn ngủ.', ok: 'Great. I\'ll take them.' },
        { npc: 'If it doesn\'t get better, see a doctor.', vi: 'Nếu không đỡ thì đi khám bác sĩ nhé.', ok: 'Okay, I will. Thanks.' }
      ] }
    ]
  };
  L['en-bank'] = {
    lang: 'en', title: 'Ngân hàng', npc: 'grant', after: 3,
    talks: [
      { title: 'Mở tài khoản', turns: [
        { npc: 'Good afternoon. How can I help you?', vi: 'Chào buổi chiều. Tôi giúp gì được bạn?', ok: 'I\'d like to open a bank account.' },
        { npc: 'Sure. Is this your first account with us?', vi: 'Được. Đây là tài khoản đầu tiên của bạn ở đây hả?', ok: 'Yes, it is.' },
        { npc: 'Can I see your ID, please?', vi: 'Cho tôi xem giấy tờ tuỳ thân nhé?', ok: 'Here\'s my passport.' },
        { npc: 'Thanks. Would you like a debit card too?', vi: 'Cảm ơn. Bạn có muốn làm thẻ ghi nợ luôn không?', ok: 'Yes, please.' },
        { npc: 'Great. It\'ll arrive by mail in a week.', vi: 'Tốt. Thẻ sẽ gửi qua bưu điện trong một tuần.', ok: 'Perfect. Thank you.' }
      ] },
      { title: 'Máy ATM giữ thẻ', turns: [
        { npc: 'Hi there. Is something wrong?', vi: 'Chào bạn. Có chuyện gì vậy?', ok: 'The ATM outside took my card.' },
        { npc: 'I\'m sorry. Did it show an error?', vi: 'Xin lỗi bạn. Máy có báo lỗi không?', ok: 'Yes, it said the card was blocked.' },
        { npc: 'Let me check. Can I have your name?', vi: 'Để tôi kiểm tra. Bạn tên gì?', ok: 'It\'s {name}.' },
        { npc: 'Okay, your card is safe. I can give it back now.', vi: 'Được rồi, thẻ của bạn vẫn an toàn. Tôi trả lại ngay.', ok: 'Oh, thank goodness.' },
        { npc: 'Please change your PIN later today.', vi: 'Hôm nay bạn nhớ đổi mã PIN nhé.', ok: 'I will. Thanks for your help.' }
      ] },
      { title: 'Đổi tiền', turns: [
        { npc: 'Next, please! What can I do for you?', vi: 'Người tiếp theo! Tôi giúp gì được bạn?', ok: 'Can I change some dollars into Vietnamese dong?' },
        { npc: 'Sure. How much would you like to change?', vi: 'Được. Bạn muốn đổi bao nhiêu?', ok: 'Two hundred dollars, please.' },
        { npc: 'Today\'s rate is a little lower than usual.', vi: 'Tỷ giá hôm nay thấp hơn mọi khi một chút.', ok: 'That\'s okay. Is there a fee?' },
        { npc: 'Yes, a three-dollar fee.', vi: 'Có, phí ba đô.', ok: 'Fine, go ahead.' },
        { npc: 'Here you go. Please count it.', vi: 'Tiền của bạn đây. Bạn đếm lại nhé.', ok: 'Thanks. It\'s all there.' }
      ] }
    ]
  };
  L['en-post'] = {
    lang: 'en', title: 'Bưu điện', npc: 'ivy', after: 4,
    talks: [
      { title: 'Gửi bưu kiện về Việt Nam', turns: [
        { npc: 'Hi! What are you sending today?', vi: 'Chào! Hôm nay bạn gửi gì?', ok: 'A package to Vietnam.' },
        { npc: 'Okay. Put it on the scale, please.', vi: 'Được. Bạn đặt lên cân nhé.', ok: 'Sure. How much does it weigh?' },
        { npc: 'Two kilos. Standard or express?', vi: 'Hai ký. Gửi thường hay gửi nhanh?', ok: 'How long does standard take?' },
        { npc: 'About two weeks. Express is five days.', vi: 'Khoảng hai tuần. Gửi nhanh thì năm ngày.', ok: 'Standard is fine.' },
        { npc: 'That\'ll be twenty-eight dollars.', vi: 'Hết hai mươi tám đô.', ok: 'Okay, here you go.' }
      ] },
      { title: 'Nhận hàng', turns: [
        { npc: 'Hi. Do you have a pickup slip?', vi: 'Chào bạn. Bạn có phiếu nhận hàng không?', ok: 'Yes, I missed a delivery yesterday.' },
        { npc: 'Can I see your ID too?', vi: 'Cho tôi xem giấy tờ tuỳ thân luôn nhé?', ok: 'Here\'s my student card.' },
        { npc: 'Thanks. Just a moment. Here it is.', vi: 'Cảm ơn. Chờ chút nhé. Hàng của bạn đây.', ok: 'Great. Do I need to sign anything?' },
        { npc: 'Yes, sign right here, please.', vi: 'Có, bạn ký vào đây nhé.', ok: 'Sure. Done.' },
        { npc: 'You\'re all set. Have a good one!', vi: 'Xong rồi. Chúc bạn một ngày vui!', ok: 'Thanks, you too.' }
      ] },
      { title: 'Mua tem gửi thư', turns: [
        { npc: 'Hello. What can I get for you?', vi: 'Chào bạn. Bạn cần gì?', ok: 'I need some stamps for postcards.' },
        { npc: 'Where are they going?', vi: 'Gửi đi đâu vậy?', ok: 'Two to Vietnam and one to Japan.' },
        { npc: 'International stamps are one fifty each.', vi: 'Tem quốc tế một đô năm mươi một con.', ok: 'Okay, three stamps, please.' },
        { npc: 'Do you need anything else?', vi: 'Bạn cần gì nữa không?', ok: 'Where\'s the mailbox?' },
        { npc: 'Right outside the front door.', vi: 'Ngay ngoài cửa trước đó.', ok: 'Thanks a lot.' }
      ] }
    ]
  };
  L['en-barber'] = {
    lang: 'en', title: 'Tiệm cắt tóc', npc: 'tony', after: 5,
    talks: [
      { title: 'Cắt tóc', turns: [
        { npc: 'Hey, have a seat! What are we doing today?', vi: 'Chào, ngồi đi! Hôm nay cắt kiểu gì?', ok: 'Just a trim, please.' },
        { npc: 'How short on the sides?', vi: 'Hai bên cắt ngắn cỡ nào?', ok: 'Short on the sides, a little longer on top.' },
        { npc: 'Got it. Do you want me to wash it first?', vi: 'Hiểu rồi. Gội đầu trước không?', ok: 'Yes, please.' },
        { npc: 'How\'s the water? Too hot?', vi: 'Nước thế nào? Nóng quá không?', ok: 'No, it\'s perfect.' },
        { npc: 'All done. What do you think?', vi: 'Xong rồi. Bạn thấy sao?', ok: 'Looks great. Thanks, Tony!' }
      ] },
      { title: 'Đặt lịch hẹn', turns: [
        { npc: 'Hi! Do you have an appointment?', vi: 'Chào! Bạn có hẹn trước không?', ok: 'No. Can I book one for tomorrow?' },
        { npc: 'Sure. Morning or afternoon?', vi: 'Được. Buổi sáng hay buổi chiều?', ok: 'After school, around four.' },
        { npc: 'Four o\'clock works. What\'s your name?', vi: 'Bốn giờ được. Bạn tên gì?', ok: 'It\'s {name}.' },
        { npc: 'Great, you\'re booked. See you tomorrow at four.', vi: 'Xong, đặt lịch rồi. Mai bốn giờ gặp nhé.', ok: 'Thanks! How much is a haircut?' },
        { npc: 'Fifteen dollars for students.', vi: 'Học sinh thì mười lăm đô.', ok: 'Awesome. See you then.' }
      ] },
      { title: 'Chưa ưng kiểu tóc', turns: [
        { npc: 'So, how do you like it?', vi: 'Sao, bạn thấy thế nào?', ok: 'Hmm, it\'s a bit too short on top.' },
        { npc: 'Oh, sorry about that. I can fix the sides to match.', vi: 'Ồ, xin lỗi nhé. Mình sửa hai bên cho cân.', ok: 'Okay, that sounds good.' },
        { npc: 'Is this better?', vi: 'Thế này được hơn chưa?', ok: 'Yeah, much better.' },
        { npc: 'Great. No charge for the fix.', vi: 'Tốt. Phần sửa không tính tiền.', ok: 'That\'s really nice of you.' },
        { npc: 'Come back anytime!', vi: 'Lúc nào cũng ghé nhé!', ok: 'I will. Thanks again.' }
      ] }
    ]
  };
  L['en-gym'] = {
    lang: 'en', title: 'Phòng gym', npc: 'max', after: 6,
    talks: [
      { title: 'Đăng ký tập', turns: [
        { npc: 'Hey, welcome! First time here?', vi: 'Chào mừng! Lần đầu tới hả?', ok: 'Yes. I\'d like to sign up.' },
        { npc: 'Great. We have monthly and yearly plans.', vi: 'Tốt. Có gói tháng và gói năm.', ok: 'How much is the monthly plan?' },
        { npc: 'Thirty dollars, or twenty for students.', vi: 'Ba mươi đô, học sinh thì hai mươi.', ok: 'I\'m a student. I\'ll take the monthly plan.' },
        { npc: 'Awesome. Do you want a free training session?', vi: 'Tuyệt. Bạn muốn một buổi tập có hướng dẫn miễn phí không?', ok: 'Sure, that would be great.' },
        { npc: 'Cool. See you tomorrow at five.', vi: 'Được. Mai năm giờ gặp nhé.', ok: 'See you tomorrow!' }
      ] },
      { title: 'Buổi tập đầu tiên', turns: [
        { npc: 'Okay, let\'s start with a warm-up.', vi: 'Được rồi, bắt đầu khởi động nhé.', ok: 'How long should I warm up?' },
        { npc: 'About ten minutes on the bike.', vi: 'Khoảng mười phút đạp xe.', ok: 'Okay. What do we do after that?' },
        { npc: 'Some squats. Keep your back straight.', vi: 'Tập squat. Giữ lưng thẳng nhé.', ok: 'Like this?' },
        { npc: 'Perfect. Do three sets of ten.', vi: 'Chuẩn. Làm ba hiệp, mỗi hiệp mười cái.', ok: 'Wow, this is harder than it looks.' },
        { npc: 'You\'re doing great. Don\'t forget to drink water.', vi: 'Bạn làm tốt lắm. Nhớ uống nước nhé.', ok: 'Thanks, Coach!' }
      ] },
      { title: 'Hỏi tủ đồ, phòng tắm', turns: [
        { npc: 'Hey, need anything?', vi: 'Chào, cần gì không?', ok: 'Where are the lockers?' },
        { npc: 'Down the hall, on the right.', vi: 'Cuối hành lang, bên phải.', ok: 'Do I need my own lock?' },
        { npc: 'Yes, or you can rent one for a dollar.', vi: 'Có, hoặc thuê một cái với giá một đô.', ok: 'I\'ll rent one, please.' },
        { npc: 'Here you go. Towels are free too.', vi: 'Của bạn đây. Khăn thì miễn phí.', ok: 'Great. Is there a shower?' },
        { npc: 'Yep, next to the lockers.', vi: 'Có, cạnh chỗ tủ đồ.', ok: 'Perfect. Thanks!' }
      ] }
    ]
  };


  /* ---------- thêm tình huống sát thực tế cho mỗi tiệm ---------- */
  function more(id, talks) { L[id].talks = L[id].talks.concat(talks); }
  more('en-barber', [
    { title: 'Hôm nay để kiểu nào?', turns: [
      { npc: 'So, what style are you thinking about today?', vi: 'Vậy hôm nay bạn định để kiểu gì?', ok: 'I\'m not sure. What do you recommend?' },
      { npc: 'You\'ve got a round face, so a fade with some volume on top would suit you.', vi: 'Mặt bạn tròn, nên kiểu fade, phía trên để phồng sẽ hợp.', ok: 'A fade? What\'s that exactly?' },
      { npc: 'Short on the sides, getting longer toward the top. It\'s really popular right now.', vi: 'Hai bên ngắn, dài dần lên phía trên. Giờ đang rất thịnh.', ok: 'Sounds good. Not too short, though.' },
      { npc: 'Got it. What about the front? Do you want bangs?', vi: 'Hiểu rồi. Còn phía trước? Bạn muốn để mái không?', ok: 'No bangs. Can you push it back?' },
      { npc: 'Sure. Want a little wax to finish?', vi: 'Được. Thêm chút sáp vuốt cho xong nhé?', ok: 'Just a little, thanks.' }
    ] },
    { title: 'Kiểu nào hợp với mình?', turns: [
      { npc: 'You\'ve got really thick hair. Lucky you!', vi: 'Tóc bạn dày ghê. Sướng nhé!', ok: 'Really? It\'s hard to style in the morning.' },
      { npc: 'Try a side part. It only takes two minutes with a comb.', vi: 'Thử rẽ ngôi lệch xem. Chải hai phút là xong.', ok: 'Which side is better for me?' },
      { npc: 'Your hair grows to the left, so part it on the left.', vi: 'Tóc bạn mọc xuôi sang trái, nên rẽ ngôi bên trái.', ok: 'Okay. Can you show me how?' },
      { npc: 'Sure. Comb it like this, then add a little gel.', vi: 'Được. Chải thế này, rồi thêm chút gel.', ok: 'Wow, that looks much neater.' },
      { npc: 'See? Come back in about four weeks for a trim.', vi: 'Thấy chưa? Khoảng bốn tuần nữa quay lại tỉa nhé.', ok: 'Will do. Thanks for the tips!' }
    ] }
  ]);
  more('en-post', [
    { title: 'Gửi thư bảo đảm', turns: [
      { npc: 'Is this letter important?', vi: 'Lá thư này quan trọng hả?', ok: 'Yes, it\'s a job application.' },
      { npc: 'Then I\'d send it by registered mail. You can track it online.', vi: 'Vậy nên gửi bảo đảm. Bạn theo dõi được trên mạng.', ok: 'How much more does that cost?' },
      { npc: 'Four dollars extra. Someone has to sign for it.', vi: 'Thêm bốn đô. Người nhận phải ký nhận.', ok: 'Okay, let\'s do that.' },
      { npc: 'Here\'s your receipt with the tracking number.', vi: 'Hoá đơn của bạn có mã theo dõi đây.', ok: 'Where do I enter the number?' },
      { npc: 'On our website. Just type it in the box.', vi: 'Trên trang web của bưu điện. Gõ vào ô là được.', ok: 'Got it. Thanks a lot.' }
    ] },
    { title: 'Hàng bị thất lạc', turns: [
      { npc: 'Hi, what seems to be the problem?', vi: 'Chào, có chuyện gì vậy?', ok: 'My package hasn\'t arrived. It\'s been two weeks.' },
      { npc: 'Do you have the tracking number?', vi: 'Bạn có mã theo dõi không?', ok: 'Yes, here it is on my phone.' },
      { npc: 'It says it\'s stuck at the sorting center.', vi: 'Hệ thống báo đang kẹt ở trung tâm phân loại.', ok: 'What can I do?' },
      { npc: 'I\'ll file a report. They\'ll call you within three days.', vi: 'Tôi sẽ lập báo cáo. Họ sẽ gọi bạn trong ba ngày.', ok: 'Okay. Here\'s my phone number.' },
      { npc: 'Thanks. Sorry for the trouble.', vi: 'Cảm ơn. Xin lỗi vì sự phiền toái.', ok: 'It\'s not your fault. Thanks for helping.' }
    ] }
  ]);
  more('en-bank', [
    { title: 'Chuyển tiền về nhà', turns: [
      { npc: 'How can I help you today?', vi: 'Hôm nay tôi giúp gì được bạn?', ok: 'I want to send money to my family in Vietnam.' },
      { npc: 'Sure. Do you have their bank details?', vi: 'Được. Bạn có thông tin ngân hàng của họ không?', ok: 'Yes, I have the account number here.' },
      { npc: 'How much would you like to send?', vi: 'Bạn muốn gửi bao nhiêu?', ok: 'Three hundred dollars.' },
      { npc: 'It usually takes two to three business days.', vi: 'Thường mất hai đến ba ngày làm việc.', ok: 'Is there a fee for that?' },
      { npc: 'Yes, fifteen dollars for international transfers.', vi: 'Có, mười lăm đô cho chuyển tiền quốc tế.', ok: 'Okay, that\'s fine.' }
    ] },
    { title: 'Mở sổ tiết kiệm', turns: [
      { npc: 'Are you interested in a savings account?', vi: 'Bạn có muốn mở tài khoản tiết kiệm không?', ok: 'Maybe. What\'s the interest rate?' },
      { npc: 'It\'s three percent a year right now.', vi: 'Hiện là ba phần trăm một năm.', ok: 'Can I take money out anytime?' },
      { npc: 'Yes, but only twice a month for free.', vi: 'Được, nhưng mỗi tháng chỉ rút miễn phí hai lần.', ok: 'Is there a minimum amount?' },
      { npc: 'You need to keep at least fifty dollars in it.', vi: 'Phải giữ ít nhất năm mươi đô trong tài khoản.', ok: 'Okay. Can I open one today?' },
      { npc: 'Sure. It\'ll only take ten minutes.', vi: 'Được. Chỉ mất mười phút thôi.', ok: 'Great, let\'s do it.' }
    ] }
  ]);
  more('en-super', [
    { title: 'Hàng khuyến mãi', turns: [
      { npc: 'Just so you know, the yogurt is buy one, get one free.', vi: 'Cho bạn biết, sữa chua đang mua một tặng một.', ok: 'Oh, nice! Which ones?' },
      { npc: 'Any flavor in the green box.', vi: 'Vị nào trong hộp xanh cũng được.', ok: 'Great. When does the sale end?' },
      { npc: 'This Sunday.', vi: 'Chủ nhật này.', ok: 'Can you check the date on this one?' },
      { npc: 'It\'s good until the twenty-fifth.', vi: 'Hạn dùng tới ngày hai mươi lăm.', ok: 'Perfect. I\'ll take two.' },
      { npc: 'Remember, you get two more for free!', vi: 'Nhớ là bạn được tặng thêm hai hộp nhé!', ok: 'Even better. Thanks!' }
    ] },
    { title: 'Quầy cân rau quả', turns: [
      { npc: 'Do you need help with the scale?', vi: 'Bạn cần giúp cân đồ không?', ok: 'Yes, please. How does it work?' },
      { npc: 'Put the bag on, then press the number for the fruit.', vi: 'Đặt túi lên, rồi bấm số của loại quả.', ok: 'What\'s the number for bananas?' },
      { npc: 'It\'s eleven. It\'s written on the sign.', vi: 'Số mười một. Có ghi trên bảng đó.', ok: 'Oh, I see it now.' },
      { npc: 'Now stick the label on the bag.', vi: 'Giờ dán nhãn lên túi.', ok: 'Done. Is this enough for a week?' },
      { npc: 'For one person, sure.', vi: 'Một người thì đủ.', ok: 'Great, thanks for your help.' }
    ] }
  ]);
  more('en-pharmacy', [
    { title: 'Hỏi cách dùng thuốc', turns: [
      { npc: 'Do you have any questions about this medicine?', vi: 'Bạn có câu hỏi gì về thuốc này không?', ok: 'Yes. Are there any side effects?' },
      { npc: 'It might make you a little sleepy.', vi: 'Có thể làm bạn hơi buồn ngủ.', ok: 'Can I drive after taking it?' },
      { npc: 'Better not. Take it before bed.', vi: 'Tốt nhất là không. Uống trước khi ngủ.', ok: 'Can my little sister take it too?' },
      { npc: 'No, it\'s only for adults. Kids need a different one.', vi: 'Không, chỉ cho người lớn. Trẻ em cần loại khác.', ok: 'Okay, I\'ll ask the doctor.' },
      { npc: 'Good idea. Anything else?', vi: 'Ý hay đó. Còn gì nữa không?', ok: 'No, that\'s all. Thanks.' }
    ] },
    { title: 'Mua kem chống nắng, đồ sơ cứu', turns: [
      { npc: 'Going somewhere sunny?', vi: 'Bạn sắp đi chỗ nắng hả?', ok: 'Yes, the beach this weekend. I need sunscreen.' },
      { npc: 'I\'d get SPF fifty. It\'s waterproof too.', vi: 'Nên lấy loại SPF năm mươi. Lại chống nước nữa.', ok: 'Great. Do you have a small first aid kit?' },
      { npc: 'Yes, it has bandages and cream for cuts.', vi: 'Có, gồm băng dán và kem bôi vết đứt.', ok: 'I\'ll take one of each.' },
      { npc: 'Don\'t forget to drink lots of water.', vi: 'Đừng quên uống nhiều nước nhé.', ok: 'I won\'t. How much is everything?' },
      { npc: 'Twenty-two fifty in total.', vi: 'Tổng cộng hai mươi hai đô năm mươi.', ok: 'Here you go.' }
    ] }
  ]);
  more('en-gym', [
    { title: 'Lớp tập nhóm', turns: [
      { npc: 'Have you tried our group classes?', vi: 'Bạn đã thử lớp tập nhóm chưa?', ok: 'Not yet. What classes do you have?' },
      { npc: 'Yoga, spinning and boxing.', vi: 'Yoga, đạp xe trong nhà và đấm bốc.', ok: 'Is yoga good for beginners?' },
      { npc: 'Totally. There\'s a class tomorrow at seven.', vi: 'Hoàn toàn được. Mai bảy giờ có một lớp.', ok: 'In the morning or evening?' },
      { npc: 'In the evening. Bring your own mat if you can.', vi: 'Buổi tối. Có thì mang thảm riêng theo nhé.', ok: 'Okay. Do I need to book?' },
      { npc: 'Yes, sign up on the app. Spots fill up fast.', vi: 'Có, đăng ký trên ứng dụng. Chỗ hết nhanh lắm.', ok: 'I\'ll book it now.' }
    ] },
    { title: 'Hỏi chế độ ăn', turns: [
      { npc: 'How\'s your training going?', vi: 'Tập luyện dạo này sao rồi?', ok: 'Good, but I\'m always hungry after.' },
      { npc: 'That\'s normal. Do you eat enough protein?', vi: 'Bình thường thôi. Bạn ăn đủ đạm không?', ok: 'I\'m not sure. What should I eat?' },
      { npc: 'Eggs, chicken, fish and beans are all great.', vi: 'Trứng, thịt gà, cá và đậu đều tốt.', ok: 'Should I eat before or after training?' },
      { npc: 'A small snack before, and a real meal after.', vi: 'Ăn nhẹ trước khi tập, ăn bữa chính sau khi tập.', ok: 'What about sugary drinks?' },
      { npc: 'Try to drink water instead.', vi: 'Cố gắng uống nước lọc thay vào đó.', ok: 'Got it. Thanks, Coach!' }
    ] }
  ]);

  /* ---------- khu riêng (nội thất) cho từng tiệm ---------- */
  var SHOPS = {
    'en-barber': { scene: 'barber_en', title: 'Tiệm cắt tóc của Tony',
      boards: [{ x: 160, y: 230, title: 'PRICES', lines: [['Haircut – $20', 'Cắt tóc: 20 đô'], ['Students – $15', 'Học sinh: 15 đô'], ['Wash & style – $10', 'Gội và tạo kiểu: 10 đô'], ['Beard trim – $8', 'Tỉa râu: 8 đô'], ['Kids under 10 – $12', 'Trẻ dưới 10 tuổi: 12 đô']], q: ['Bạn là học sinh, cắt tóc và gội tạo kiểu hết bao nhiêu?', '$15 + $10 = $25'] }] },
    'en-post': { scene: 'post_en', title: 'Bưu điện Brightford',
      boards: [{ x: 210, y: 230, title: 'SHIPPING', lines: [['Letter (local) – $0.70', 'Thư trong nước: 0,7 đô'], ['Letter (international) – $1.50', 'Thư quốc tế: 1,5 đô'], ['Standard parcel – 10–14 days', 'Bưu kiện thường: 10–14 ngày'], ['Express parcel – 3–5 days', 'Bưu kiện nhanh: 3–5 ngày'], ['Open Mon–Sat, 8 AM – 6 PM', 'Mở cửa thứ Hai – thứ Bảy, 8 giờ sáng – 6 giờ chiều']], q: ['Chủ nhật bưu điện có mở cửa không?', 'Không, chỉ mở thứ Hai đến thứ Bảy'] }] },
    'en-bank': { scene: 'bank_en', title: 'Ngân hàng Brightford',
      boards: [{ x: 960, y: 230, title: 'EXCHANGE RATES', lines: [['1 USD = 25,400 VND', '1 đô Mỹ = 25.400 đồng'], ['1 EUR = 27,300 VND', '1 euro = 27.300 đồng'], ['Fee: $3 per exchange', 'Phí: 3 đô mỗi lần đổi'], ['Savings: 3% a year', 'Tiết kiệm: 3% một năm'], ['ATM open 24/7', 'ATM mở 24/7']], q: ['Đổi 100 đô được khoảng bao nhiêu tiền đồng (chưa trừ phí)?', 'Khoảng 2.540.000 đồng'] }] },
    'en-super': { scene: 'super_en', title: 'Siêu thị mini',
      boards: [{ x: 1300, y: 230, title: 'TODAY\'S DEALS', lines: [['Yogurt – buy 1, get 1 free', 'Sữa chua: mua 1 tặng 1'], ['Bananas – $0.59 / lb', 'Chuối: 0,59 đô một pao'], ['Bread – 20% off', 'Bánh mì: giảm 20%'], ['Eggs (12) – $3.99', 'Trứng (12 quả): 3,99 đô'], ['Bring your own bag!', 'Hãy mang túi riêng!']], q: ['Mua 2 hộp sữa chua thì trả tiền mấy hộp?', 'Chỉ 1 hộp (mua 1 tặng 1)'] }] },
    'en-pharmacy': { scene: 'pharmacy_en', title: 'Hiệu thuốc',
      boards: [{ x: 1300, y: 230, title: 'OPEN HOURS', lines: [['Mon – Fri: 8 AM – 9 PM', 'Thứ Hai – thứ Sáu: 8 giờ sáng – 9 giờ tối'], ['Sat – Sun: 9 AM – 6 PM', 'Thứ Bảy – Chủ nhật: 9 giờ sáng – 6 giờ chiều'], ['Prescriptions ready in 15 min', 'Thuốc theo đơn có sau 15 phút'], ['Ask us about side effects', 'Hãy hỏi chúng tôi về tác dụng phụ'], ['Emergency? Call 911', 'Cấp cứu? Gọi 911']], q: ['Chủ nhật 8 giờ tối hiệu thuốc còn mở không?', 'Không, cuối tuần đóng cửa lúc 6 giờ chiều'] }] },
    'en-gym': { scene: 'gym_en', title: 'Phòng gym',
      boards: [{ x: 1300, y: 230, title: 'CLASSES', lines: [['Yoga – Mon & Wed, 7 PM', 'Yoga: thứ Hai và thứ Tư, 7 giờ tối'], ['Spinning – Tue & Thu, 6 PM', 'Đạp xe: thứ Ba và thứ Năm, 6 giờ tối'], ['Boxing – Sat, 10 AM', 'Đấm bốc: thứ Bảy, 10 giờ sáng'], ['Book on the app', 'Đặt chỗ trên ứng dụng'], ['Towels are free', 'Khăn miễn phí']], q: ['Bạn chỉ rảnh thứ Bảy buổi sáng. Bạn tập lớp nào được?', 'Lớp đấm bốc (Boxing) 10 giờ sáng'] }] }
  };
  G.SHOPS = SHOPS;
  /* tiệm có ảnh nội thất: chỗ người bán đứng sau quầy (teacher), phần quầy vẽ đè lên người bán (front: x, y, rộng, cao),
     chỗ đứng nói chuyện (talk), khung đi lại (walk), cửa ra (exit), bảng đứng trên sàn (board), đồ đạc chắn đường (blocks),
     cửa sổ đổi màu theo buổi và mưa (wins: ['o', tâm x, tâm y, bán kính] hoặc ['r', x, y, rộng, cao]) */
  var LAY = {
    'en-barber': { bg: 'interior_en_barber.png', teacher: { x: 1000, y: 500 }, front: [880, 466, 240, 222], talk: { x: 1000, y: 730 },
      walk: { x0: 40, y0: 705, x1: 1470, y1: 1000 }, exit: { x: 755, y: 975 }, board: { x: 250, y: 800 },
      wins: [['o', 567, 140, 96], ['o', 867, 140, 96], ['o', 1171, 140, 96]] },
    'en-post': { bg: 'interior_en_post.png', teacher: { x: 890, y: 440 }, front: [770, 405, 240, 212], talk: { x: 890, y: 670 },
      walk: { x0: 190, y0: 640, x1: 1350, y1: 995 }, exit: { x: 765, y: 985 }, board: { x: 360, y: 790 }, blocks: [[955, 790, 1125, 1024]] },
    'en-pharmacy': { bg: 'interior_en_pharmacy.png', teacher: { x: 700, y: 456 }, front: [580, 437, 240, 178], talk: { x: 700, y: 650 },
      walk: { x0: 280, y0: 620, x1: 1470, y1: 845 }, exit: { x: 757, y: 835 }, board: { x: 1340, y: 690 }, wins: [['r', 1200, 100, 100, 113]] },
    'en-gym': { bg: 'interior_en_gym.png', teacher: { x: 600, y: 470 }, front: [480, 437, 240, 165], talk: { x: 600, y: 640 },
      walk: { x0: 170, y0: 610, x1: 1360, y1: 960 }, exit: { x: 766, y: 955 }, board: { x: 300, y: 770 },
      blocks: [[1200, 460, 1440, 780], [515, 860, 625, 1000], [910, 860, 1015, 1000]], wins: [['r', 317, 40, 870, 267]] },
    'en-bank': { bg: 'interior_en_bank.png', teacher: { x: 773, y: 450 }, front: [600, 405, 346, 132], glass: [652, 285, 241, 122, 0.32], talk: { x: 773, y: 585 },
      walk: { x0: 60, y0: 545, x1: 1470, y1: 900 }, exit: { x: 768, y: 890 }, board: { x: 1180, y: 690 },
      blocks: [[100, 520, 190, 570], [0, 600, 150, 860], [1260, 520, 1460, 600], [1370, 600, 1480, 680]] },
    'en-super': { bg: 'interior_en_super.png', teacher: { x: 760, y: 470 }, front: [640, 440, 240, 175], talk: { x: 760, y: 650 },
      walk: { x0: 160, y0: 630, x1: 1370, y1: 885 }, exit: { x: 760, y: 878 }, board: { x: 1250, y: 690 } }
  };
  // world.js tạo G.SCENES sau file này: ghi vào G.SCENE_MORE rồi world.js gộp vào
  var SM = G.SCENE_MORE || (G.SCENE_MORE = {});
  for (var lid in SHOPS) if (SHOPS.hasOwnProperty(lid)) {
    var S = SHOPS[lid], Y = LAY[lid];
    if (!Y) continue;   // tiệm nào cũng phải có ảnh nội thất và bố cục trong LAY
    var bds = [], blk = (Y.blocks || []).slice();
    for (var bi = 0; bi < S.boards.length; bi++) {
      var b0 = S.boards[bi], bx = Y.board.x + bi * 200;
      bds.push({ x: bx, y: Y.board.y, title: b0.title, lines: b0.lines, q: b0.q, floor: 1 });
      blk.push([bx - 72, Y.board.y + 40, bx + 72, Y.board.y + 82]);   // chân bảng
    }
    SM[S.scene] = {
      city: 'en', title: S.title, bg: Y.bg, w: 1536, h: 1024, kind: 'shop', life: lid, npc: L[lid].npc,
      walk: Y.walk, teacher: Y.teacher, talk: Y.talk, room: S, lay: Y, boards: bds, blocks: blk,
      exit: { x: Y.exit.x, y: Y.exit.y, label: 'Ra phố', to: { back: 1 } }
    };
  }

  /* Phố mua sắm: khu riêng nối với trung tâm (mép phải bản đồ trung tâm). Ảnh nền map_street_en.png:
     4 ô đất phía trên đường (bưu điện, ngân hàng, hiệu thuốc, tiệm tóc), siêu thị giữa quảng trường bầu dục phía dưới.
     Cây, đèn, ghế, bồn hoa, hàng rào cây đã vẽ sẵn trong ảnh. */
  SM.street_en = {
    city: 'en', title: 'Phố mua sắm', bg: 'map_street_en.png', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 150, y: 330 },
    walk: { x0: 30, y0: 90, x1: 1506, y1: 1000 },
    gates: [{ x: 45, y: 330, side: 'left', label: 'Về trung tâm Brightford', sign: '‹ Trung tâm', to: { scene: 'city_en', x: 1385, y: 512, dir: 'left' } }],
    props: [{ img: 'prop_car.png', x: 1300, y: 522, s: 150, r: 46 }]
  };
  G.PEOPLE = G.PEOPLE || {};
  G.PEOPLE.street_en = [
    { npc: 'ivy', life: 'en-post', x: 183, y: 232, dir: 'down', stall: 'Bưu điện', icon: '📮', bimg: 'building_en_post.png', bs: 240 },
    { npc: 'grant', life: 'en-bank', x: 579, y: 232, dir: 'down', stall: 'Ngân hàng', icon: '🏦', bimg: 'building_en_bank.png', bs: 240 },
    { npc: 'lee', life: 'en-pharmacy', x: 966, y: 232, dir: 'down', stall: 'Hiệu thuốc', icon: '💊', bimg: 'building_en_pharmacy.png', bs: 240 },
    { npc: 'tony', life: 'en-barber', x: 1351, y: 232, dir: 'down', stall: 'Tiệm tóc', icon: '💈', bimg: 'building_en_barber.png', bs: 240 },
    { npc: 'ray', life: 'en-super', x: 768, y: 874, dir: 'down', stall: 'Siêu thị mini', icon: '🛒', bimg: 'building_en_super.png', bs: 290 }
  ];
  // phòng gym ở khu phố Maple, gần nhà
  G.PEOPLE.home_en = (G.PEOPLE.home_en || []).concat([
    { npc: 'max', life: 'en-gym', x: 440, y: 250, dir: 'down', stall: 'Phòng gym', icon: '🏋️', bimg: 'pc_gym.png', bs: 260 }
  ]);

  /* nói tự do sau giờ học */
  G.FREE_MORE = (G.FREE_MORE || []).concat([
    { id: 'super-rice', place: 'en-super', npc: 'ray', sit: 'Ở siêu thị. Hỏi gạo để ở đâu và có loại túi nhỏ không.', q: 'Hi there, looking for something?', vi: 'Chào, bạn tìm gì à?',
      need: [['where'], ['rice'], ['small', 'little'], ['bag', 'bags', 'pack']],
      sample: ['Where can I find rice? Do you have small bags?', 'Excuse me, where\'s the rice? Do you have a small bag?'] },
    { id: 'pharmacy-cough', place: 'en-pharmacy', npc: 'lee', sit: 'Ở hiệu thuốc. Nói bạn bị ho ba ngày rồi và hỏi mua thuốc.', q: 'Hi, what can I help you with?', vi: 'Chào, tôi giúp gì được bạn?',
      need: [['cough', 'coughing'], ['three', '3'], ['day', 'days'], ['medicine', 'something', 'anything', 'tablets', 'syrup']],
      sample: ['I\'ve had a cough for three days. Do you have any medicine?', 'I\'m coughing for three days. Can I get something for it?'] },
    { id: 'bank-lost', place: 'en-bank', npc: 'grant', sit: 'Ở ngân hàng. Báo bạn làm mất thẻ ngân hàng và muốn khoá thẻ.', q: 'Good afternoon. What can I do for you?', vi: 'Chào buổi chiều. Tôi giúp gì được bạn?',
      need: [['lost', 'lose', 'can\'t find', 'missing'], ['card'], ['block', 'cancel', 'stop', 'freeze', 'lock']],
      sample: ['I lost my bank card. Can you block it, please?', 'I can\'t find my card. I want to cancel it.'] },
    { id: 'post-express', place: 'en-post', npc: 'ivy', sit: 'Ở bưu điện. Gửi một lá thư đi Nhật bằng dịch vụ nhanh, hỏi mấy ngày tới nơi.', q: 'Hi! What are you sending today?', vi: 'Chào! Hôm nay bạn gửi gì?',
      need: [['letter', 'package', 'parcel'], ['japan'], ['express', 'fast', 'quick'], ['how long', 'how many days', 'when']],
      sample: ['I\'d like to send this letter to Japan by express. How long will it take?', 'A letter to Japan, express please. How many days?'] },
    { id: 'barber-style', place: 'en-barber', npc: 'tony', sit: 'Ở tiệm tóc. Mô tả kiểu tóc: hai bên cắt ngắn, phía trên giữ dài.', q: 'Hey! How do you want your hair today?', vi: 'Chào! Hôm nay bạn muốn cắt kiểu gì?',
      need: [['short'], ['side', 'sides'], ['top'], ['long', 'longer', 'keep']],
      sample: ['Short on the sides, and keep it long on top, please.', 'Can you cut the sides short but keep the top longer?'] },
    { id: 'gym-goal', place: 'en-gym', npc: 'max', sit: 'Ở phòng gym. Nói mục tiêu: khoẻ hơn và giảm cân, bạn tập được 3 buổi một tuần.', q: 'So, what are your goals?', vi: 'Vậy mục tiêu của bạn là gì?',
      need: [['strong', 'stronger', 'fit', 'healthy', 'muscle'], ['lose weight', 'lose', 'weight'], ['three', '3'], ['week', 'times']],
      sample: ['I want to get stronger and lose weight. I can train three times a week.', 'My goal is to lose weight and be healthier. I can come three times a week.'] }
  ]);
})();
