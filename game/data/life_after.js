/* "Sau giờ học": 6 nơi đời sống thật ở trung tâm Brightford.
   Siêu thị mini · Hiệu thuốc · Ngân hàng · Bưu điện · Tiệm cắt tóc · Phòng gym.
   Mỗi nơi 3 tình huống × 5 lượt + 1 câu "Nói tự do". Nhân vật ghép từ lớp hình có sẵn, quầy vẽ bằng code. */
var G = window.G || (window.G = {});

(function () {
  var N = G.NPC_MORE || (G.NPC_MORE = {});
  N.ray = { name: 'Ray', av: { ao: 'uniform', mat: 'cool', toc: 'messy', mauToc: '#2a2220' }, role: 'Thu ngân siêu thị' };
  N.lee = { name: 'Ms. Lee', av: { ao: 'uniform', mat: 'calm', toc: 'long', mauToc: '#5b3a29' }, role: 'Dược sĩ' };
  N.grant = { name: 'Mr. Grant', av: { ao: 'jacket', mat: 'calm', toc: 'sidepart', mauToc: '#8a5a3b' }, role: 'Nhân viên ngân hàng' };
  N.ivy = { name: 'Ivy', av: { ao: 'sweater', mat: 'smile', toc: 'curly', mauToc: '#c8553d' }, role: 'Nhân viên bưu điện' };
  N.tony = { name: 'Tony', av: { ao: 'tech', mat: 'wink', toc: 'spiky', mauToc: '#2a2220' }, role: 'Thợ cắt tóc' };
  N.max = { name: 'Coach Max', av: { ao: 'sport', mat: 'smile', toc: 'bowl', mauToc: '#c9893e' }, role: 'Huấn luyện viên phòng gym' };

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

  /* quầy ở trung tâm (thêm vào danh sách người đứng trên bản đồ city_en) */
  G.PEOPLE = G.PEOPLE || {};
  G.PEOPLE.city_en = (G.PEOPLE.city_en || []).concat([
    { npc: 'ray', life: 'en-super', x: 160, y: 660, dir: 'down', stall: 'Siêu thị mini', icon: '🛒' },
    { npc: 'lee', life: 'en-pharmacy', x: 1390, y: 660, dir: 'down', stall: 'Hiệu thuốc', icon: '💊' },
    { npc: 'grant', life: 'en-bank', x: 1445, y: 235, dir: 'down', stall: 'Ngân hàng', icon: '🏦' },
    { npc: 'ivy', life: 'en-post', x: 575, y: 330, dir: 'down', stall: 'Bưu điện', icon: '📮' },
    { npc: 'tony', life: 'en-barber', x: 960, y: 330, dir: 'down', stall: 'Cắt tóc', icon: '💈' }
  ]);
  // phòng gym ở khu phố Maple, gần nhà
  G.PEOPLE.home_en = (G.PEOPLE.home_en || []).concat([
    { npc: 'max', life: 'en-gym', x: 130, y: 420, dir: 'down', stall: 'Phòng gym', icon: '🏋️' }
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
