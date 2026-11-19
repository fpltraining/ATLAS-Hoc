/* "Một ngày ở trường": 5 nơi nói chuyện thật trong hành lang Trường Anh ngữ.
   Căng tin · Thư viện · Phòng y tế · Bạn cùng lớp · Câu lạc bộ (có CLB esports).
   Mỗi nơi 3 tình huống × 5 lượt; thêm câu "Nói tự do" cho từng nơi (G.FREE_TALK). Nhân vật ghép từ lớp hình có sẵn. */
var G = window.G || (window.G = {});

(function () {
  var N = G.NPC_MORE || (G.NPC_MORE = {});
  N.pat = { img: 'npc_pat.png', name: 'Ms. Pat', av: { ao: 'uniform', mat: 'smile', toc: 'bun', mauToc: '#8a5a3b' }, role: 'Cô căng tin' };
  N.owen = { img: 'npc_owen.png', name: 'Mr. Owen', av: { ao: 'jacket', mat: 'calm', toc: 'sidepart', mauToc: '#2a2220' }, role: 'Thủ thư' };
  N.kim = { img: 'npc_kim.png', name: 'Nurse Kim', av: { ao: 'uniform', mat: 'gentle', toc: 'ponytail', mauToc: '#2a2220' }, role: 'Cô y tế' };
  N.jake = { img: 'npc_jake.png', name: 'Jake', av: { ao: 'hoodie', mat: 'wink', toc: 'spiky', mauToc: '#c9893e' }, role: 'Bạn cùng lớp' };
  N.zoe = { img: 'npc_zoe.png', name: 'Zoe', av: { ao: 'sport', mat: 'sparkle', toc: 'ponytail', mauToc: '#c8553d' }, role: 'Trưởng CLB' };

  var L = G.LIFE || (G.LIFE = {});
  L['en-canteen'] = {
    lang: 'en', title: 'Căng tin trường', npc: 'pat', school: 1,
    talks: [
      { title: 'Chọn món trưa', turns: [
        { npc: 'Hi, hon! What would you like today?', vi: 'Chào con! Hôm nay con ăn gì?', ok: 'What are the options?' },
        { npc: 'We\'ve got pasta, chicken curry or a veggie wrap.', vi: 'Có mì Ý, cà ri gà hoặc bánh cuộn rau.', ok: 'I\'ll have the chicken curry, please.' },
        { npc: 'Rice or bread with that?', vi: 'Ăn kèm cơm hay bánh mì?', ok: 'Rice, please.' },
        { npc: 'Want a fruit cup too? It\'s free today.', vi: 'Lấy thêm cốc trái cây không? Hôm nay miễn phí.', ok: 'Sure, why not?' },
        { npc: 'Here you go. Enjoy your lunch!', vi: 'Của con đây. Ăn ngon nhé!', ok: 'Thank you!' }
      ] },
      { title: 'Trả bằng thẻ học sinh', turns: [
        { npc: 'That\'s three fifty. Card or cash?', vi: 'Ba đô năm mươi. Thẻ hay tiền mặt?', ok: 'Can I use my student card?' },
        { npc: 'Sure. Just tap it here.', vi: 'Được. Chạm thẻ vào đây.', ok: 'Okay. Is there enough money on it?' },
        { npc: 'You\'ve got two dollars left.', vi: 'Trong thẻ còn hai đô.', ok: 'Oh, I need to top it up.' },
        { npc: 'You can do that at the front office.', vi: 'Con nạp tiền ở văn phòng trước nhé.', ok: 'Got it. Thanks for telling me.' },
        { npc: 'No problem. Next!', vi: 'Không có gì. Người tiếp theo!', ok: 'Have a good day!' }
      ] },
      { title: 'Hỏi về món ăn', turns: [
        { npc: 'Careful, the soup\'s really hot.', vi: 'Cẩn thận, súp nóng lắm đó.', ok: 'Thanks. Does it have any meat in it?' },
        { npc: 'No, it\'s vegetable soup.', vi: 'Không, súp rau thôi.', ok: 'Great, I don\'t eat pork.' },
        { npc: 'Then the pasta\'s fine too. No pork.', vi: 'Vậy mì Ý cũng được. Không có thịt heo.', ok: 'Perfect. Can I get a small bowl of soup?' },
        { npc: 'Here. Napkins are over there.', vi: 'Đây. Khăn giấy ở đằng kia.', ok: 'Thanks, Ms. Pat.' },
        { npc: 'See you tomorrow, sweetie.', vi: 'Mai gặp lại nhé con.', ok: 'See you!' }
      ] }
    ]
  };
  L['en-library'] = {
    lang: 'en', title: 'Thư viện', npc: 'owen', school: 2,
    talks: [
      { title: 'Mượn sách', turns: [
        { npc: 'Hi there. Can I help you find something?', vi: 'Chào em. Thầy giúp em tìm gì không?', ok: 'Yes, I\'m looking for easy English books.' },
        { npc: 'The easy readers are on the second shelf.', vi: 'Sách đọc dễ ở kệ thứ hai.', ok: 'Can I borrow two at a time?' },
        { npc: 'You can borrow up to five.', vi: 'Em mượn được tối đa năm cuốn.', ok: 'Great. How long can I keep them?' },
        { npc: 'Two weeks. Can I see your student card?', vi: 'Hai tuần. Cho thầy xem thẻ học sinh nhé?', ok: 'Here you go.' },
        { npc: 'All set. They\'re due on the twenty-eighth.', vi: 'Xong rồi. Hạn trả là ngày hai mươi tám.', ok: 'Thanks. I\'ll bring them back on time.' }
      ] },
      { title: 'Trả sách muộn', turns: [
        { npc: 'Hi. Are you returning these?', vi: 'Chào em. Em trả mấy cuốn này hả?', ok: 'Yes. Sorry, they\'re a few days late.' },
        { npc: 'That\'s okay. There\'s a small fine of fifty cents.', vi: 'Không sao. Có phí phạt nhỏ năm mươi xu.', ok: 'No problem. Can I pay now?' },
        { npc: 'Sure. Did you like them?', vi: 'Được. Em thấy sách hay không?', ok: 'Yeah, the second one was really good.' },
        { npc: 'I can recommend more like it.', vi: 'Thầy giới thiệu thêm vài cuốn kiểu đó nhé.', ok: 'That would be great, thanks.' },
        { npc: 'Try this one. It\'s very popular.', vi: 'Thử cuốn này đi. Nhiều người thích lắm.', ok: 'Thanks, I\'ll take it.' }
      ] },
      { title: 'Tìm chỗ học yên tĩnh', turns: [
        { npc: 'Please keep it down a little.', vi: 'Em nói nhỏ một chút nhé.', ok: 'Sorry. Is there a quiet room to study?' },
        { npc: 'Yes, room B at the back. It\'s free now.', vi: 'Có, phòng B ở phía sau. Giờ đang trống.', ok: 'Can I use a computer there?' },
        { npc: 'Yes, but you need to log in with your student ID.', vi: 'Được, nhưng em phải đăng nhập bằng mã học sinh.', ok: 'Okay. What\'s the Wi-Fi password?' },
        { npc: 'It\'s on the card next to the computer.', vi: 'Có ghi trên tấm thẻ cạnh máy tính.', ok: 'Got it. Thank you.' },
        { npc: 'You\'re welcome. Good luck with your studying.', vi: 'Không có gì. Học tốt nhé.', ok: 'Thanks!' }
      ] }
    ]
  };
  L['en-nurse'] = {
    lang: 'en', title: 'Phòng y tế', npc: 'kim', school: 3,
    talks: [
      { title: 'Bị đau đầu', turns: [
        { npc: 'Hi, come in. What\'s wrong?', vi: 'Chào em, vào đi. Em bị sao?', ok: 'I have a bad headache.' },
        { npc: 'When did it start?', vi: 'Bắt đầu từ lúc nào?', ok: 'This morning, after breakfast.' },
        { npc: 'Did you drink enough water today?', vi: 'Hôm nay em uống đủ nước chưa?', ok: 'Not really. Just a little.' },
        { npc: 'Okay. Drink this and lie down for twenty minutes.', vi: 'Được rồi. Uống cái này rồi nằm nghỉ hai mươi phút.', ok: 'Okay. Should I tell my teacher?' },
        { npc: 'Don\'t worry, I\'ll call her.', vi: 'Đừng lo, cô sẽ gọi cho cô giáo.', ok: 'Thank you so much.' }
      ] },
      { title: 'Bị ngã trầy đầu gối', turns: [
        { npc: 'Oh no, what happened to your knee?', vi: 'Ôi, đầu gối em bị sao vậy?', ok: 'I fell during PE class.' },
        { npc: 'Let me clean it. This might sting a little.', vi: 'Để cô rửa vết thương. Có thể hơi xót đó.', ok: 'Ouch! Okay, I\'m fine.' },
        { npc: 'There. I\'ll put a bandage on it.', vi: 'Xong. Cô dán băng cho em.', ok: 'Thanks. Can I go back to class?' },
        { npc: 'Yes, but no running today.', vi: 'Được, nhưng hôm nay đừng chạy nhé.', ok: 'Got it. No running.' },
        { npc: 'Come back if it starts to hurt more.', vi: 'Đau hơn thì quay lại đây nhé.', ok: 'I will. Thanks, Nurse Kim.' }
      ] },
      { title: 'Xin về sớm', turns: [
        { npc: 'You look pale. Are you okay?', vi: 'Trông em xanh xao quá. Em ổn không?', ok: 'Not really. I feel sick and dizzy.' },
        { npc: 'Let me check your temperature. It\'s a bit high.', vi: 'Để cô đo nhiệt độ. Hơi cao đó.', ok: 'Do I have a fever?' },
        { npc: 'A small one. I think you should go home.', vi: 'Sốt nhẹ. Cô nghĩ em nên về nhà.', ok: 'Can you call my mom?' },
        { npc: 'Sure. Is her number in your student file?', vi: 'Được. Số của mẹ em có trong hồ sơ không?', ok: 'Yes, it is.' },
        { npc: 'Okay, I\'ll call her now. Rest here.', vi: 'Được, cô gọi ngay. Em nằm nghỉ ở đây nhé.', ok: 'Thank you.' }
      ] }
    ]
  };
  L['en-classmate'] = {
    lang: 'en', title: 'Bạn cùng lớp', npc: 'jake', school: 4,
    talks: [
      { title: 'Làm quen', turns: [
        { npc: 'Hey, are you new here?', vi: 'Ê, bạn mới tới hả?', ok: 'Yeah, it\'s my first week.' },
        { npc: 'Cool. I\'m Jake. What\'s your name?', vi: 'Hay đó. Mình là Jake. Bạn tên gì?', ok: 'I\'m {name}. Nice to meet you.' },
        { npc: 'Where are you from?', vi: 'Bạn từ đâu tới?', ok: 'I\'m from Vietnam.' },
        { npc: 'Awesome. Do you like it here so far?', vi: 'Tuyệt. Tới giờ bạn thấy ở đây thích không?', ok: 'Yeah, everyone\'s really nice.' },
        { npc: 'Want to sit with us at lunch?', vi: 'Trưa ngồi ăn với tụi mình không?', ok: 'Sure, I\'d love to!' }
      ] },
      { title: 'Hỏi bài', turns: [
        { npc: 'Did you finish the homework?', vi: 'Bạn làm bài tập về nhà xong chưa?', ok: 'Not yet. I don\'t get question three.' },
        { npc: 'Oh, that one\'s tricky. Want me to explain?', vi: 'À, câu đó khó. Để mình giải thích nhé?', ok: 'Yes, please. That would help a lot.' },
        { npc: 'You just need to read the text again.', vi: 'Bạn chỉ cần đọc lại đoạn văn thôi.', ok: 'Oh, I see. That makes sense now.' },
        { npc: 'Easy, right?', vi: 'Dễ mà, đúng không?', ok: 'Yeah. Thanks, Jake!' },
        { npc: 'No problem. You can help me with math later.', vi: 'Không có gì. Lát bạn chỉ mình môn toán nhé.', ok: 'Deal!' }
      ] },
      { title: 'Rủ đi xem phim', turns: [
        { npc: 'Hey, a few of us are going to the movies on Saturday.', vi: 'Ê, thứ Bảy tụi mình đi xem phim.', ok: 'Oh, nice. What are you going to see?' },
        { npc: 'The new space movie. Want to come?', vi: 'Phim vũ trụ mới. Đi không?', ok: 'Sure! What time?' },
        { npc: 'Around three. We\'ll meet at the station.', vi: 'Khoảng ba giờ. Gặp nhau ở ga nhé.', ok: 'Okay. Should I buy a ticket online?' },
        { npc: 'Yeah, it\'s cheaper online.', vi: 'Ừ, mua trên mạng rẻ hơn.', ok: 'Got it. I\'ll get one tonight.' },
        { npc: 'Cool. See you Saturday!', vi: 'Ok. Thứ Bảy gặp nhé!', ok: 'See you!' }
      ] }
    ]
  };
  L['en-club'] = {
    lang: 'en', title: 'Câu lạc bộ', npc: 'zoe', school: 5,
    talks: [
      { title: 'Tìm hiểu câu lạc bộ', turns: [
        { npc: 'Hi! Are you interested in joining a club?', vi: 'Chào! Bạn có muốn tham gia câu lạc bộ không?', ok: 'Maybe. What clubs are there?' },
        { npc: 'We\'ve got soccer, music, drama and esports.', vi: 'Có bóng đá, âm nhạc, kịch và thể thao điện tử.', ok: 'Esports? That sounds fun.' },
        { npc: 'We practice on Tuesdays and Thursdays after school.', vi: 'Tụi mình tập thứ Ba và thứ Năm sau giờ học.', ok: 'What time does it finish?' },
        { npc: 'Around five thirty.', vi: 'Khoảng năm rưỡi.', ok: 'That works for me.' },
        { npc: 'Great! Want to sign up?', vi: 'Tuyệt! Đăng ký luôn không?', ok: 'Yes, please. Where do I sign?' }
      ] },
      { title: 'Buổi sinh hoạt đầu tiên', turns: [
        { npc: 'Welcome to the club! Let\'s go around and introduce ourselves.', vi: 'Chào mừng tới CLB! Mọi người lần lượt giới thiệu nhé.', ok: 'Hi everyone, I\'m {name}.' },
        { npc: 'What games do you play?', vi: 'Bạn chơi game gì?', ok: 'I mostly play team games, like MOBA games.' },
        { npc: 'Cool! What role do you usually play?', vi: 'Hay đó! Bạn hay chơi vị trí nào?', ok: 'I usually play support.' },
        { npc: 'We need a good support. Are you free for a match on Friday?', vi: 'Tụi mình đang cần một support giỏi. Thứ Sáu đánh một trận không?', ok: 'Sure, count me in!' },
        { npc: 'Awesome. See you then!', vi: 'Tuyệt. Hẹn gặp nhé!', ok: 'See you!' }
      ] },
      { title: 'Xin nghỉ một buổi tập', turns: [
        { npc: 'Hey, are you coming to practice today?', vi: 'Ê, hôm nay bạn đi tập không?', ok: 'Sorry, I can\'t make it today.' },
        { npc: 'Oh no. Is everything okay?', vi: 'Ôi. Có chuyện gì không?', ok: 'Yeah, I just have a dentist appointment.' },
        { npc: 'No worries. Can you come on Thursday?', vi: 'Không sao. Thứ Năm bạn tới được không?', ok: 'Yes, I\'ll be there on Thursday.' },
        { npc: 'Great. I\'ll send you the new schedule.', vi: 'Tốt. Mình sẽ gửi bạn lịch tập mới.', ok: 'Thanks. Sorry again.' },
        { npc: 'It\'s fine. Take care!', vi: 'Không sao. Giữ gìn sức khoẻ nhé!', ok: 'You too!' }
      ] }
    ]
  };

  /* Người đứng trong hành lang trường */
  G.PEOPLE = G.PEOPLE || {};
  G.PEOPLE.en_hall = [
    { npc: 'pat', life: 'en-canteen', x: 1075, y: 540, dir: 'down', stall: 'Căng tin', icon: '🍱', simg: 'pc_canteen.png', ss: 280 },
    { npc: 'owen', life: 'en-library', x: 560, y: 470, dir: 'down' },
    { npc: 'kim', life: 'en-nurse', x: 1190, y: 790, dir: 'left' },
    { npc: 'jake', life: 'en-classmate', x: 610, y: 660, dir: 'right' },
    { npc: 'zoe', life: 'en-club', x: 830, y: 470, dir: 'down' }
  ];

  /* nói tự do ở trường */
  // practice_en.js tạo G.FREE_TALK sau file này, nên ghi vào G.FREE_MORE rồi gộp ở đó
  G.FREE_MORE = (G.FREE_MORE || []).concat([
    { id: 'canteen-diet', place: 'en-canteen', npc: 'pat', sit: 'Ở căng tin. Bạn không ăn được thịt heo. Hỏi món nào không có thịt heo và chọn một món.', q: 'What can I get you, hon?', vi: 'Con lấy gì nào?',
      need: [['pork'], ['no', 'without', 'don\'t eat', 'not'], ['which', 'what', 'is there', 'does']],
      sample: ['I don\'t eat pork. Which dishes don\'t have pork?', 'Is there anything without pork? I\'ll take that one.'] },
    { id: 'library-find', place: 'en-library', npc: 'owen', sit: 'Ở thư viện. Hỏi mượn một cuốn sách về bóng đá và hỏi được giữ bao lâu.', q: 'Hi, what are you looking for?', vi: 'Chào em, em tìm gì?',
      need: [['book', 'books'], ['soccer', 'football'], ['how long', 'keep', 'when']],
      sample: ['I\'m looking for a book about soccer. How long can I keep it?', 'Do you have any books about football? How long can I borrow it?'] },
    { id: 'nurse-stomach', place: 'en-nurse', npc: 'kim', sit: 'Ở phòng y tế. Nói bạn đau bụng từ sau bữa trưa và hơi buồn nôn.', q: 'Come in. How are you feeling?', vi: 'Vào đi em. Em thấy trong người thế nào?',
      need: [['stomach', 'stomachache', 'tummy'], ['lunch', 'after lunch'], ['sick', 'throw up', 'nausea', 'feel bad']],
      sample: ['I have a stomachache since lunch, and I feel a bit sick.', 'My stomach hurts after lunch. I feel like I\'m going to throw up.'] },
    { id: 'classmate-invite', place: 'en-classmate', npc: 'jake', sit: 'Rủ Jake chiều thứ Bảy qua nhà bạn chơi game lúc 2 giờ.', q: 'Hey! Any plans this weekend?', vi: 'Ê! Cuối tuần có kế hoạch gì không?',
      need: [['saturday', 'weekend'], ['game', 'games', 'play'], ['two', '2'], ['my house', 'my place', 'come over', 'come to']],
      sample: ['Do you want to come over on Saturday at two and play games?', 'Come to my house on Saturday at 2. We can play games.'] },
    { id: 'club-role', place: 'en-club', npc: 'zoe', sit: 'Ở CLB esports. Kể bạn hay chơi vị trí nào và bạn đã chơi bao lâu.', q: 'So tell me, what kind of player are you?', vi: 'Kể mình nghe, bạn là kiểu người chơi thế nào?',
      need: [['play', 'main', 'usually'], ['support', 'jungle', 'jungler', 'mid', 'carry', 'tank', 'solo', 'adc'], ['year', 'years', 'month', 'months', 'since']],
      sample: ['I usually play support. I\'ve played for three years.', 'I main jungle. I\'ve been playing for about two years.'] }
  ]);
})();
