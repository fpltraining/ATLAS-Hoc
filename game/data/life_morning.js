/* "Buổi sáng ở Brightford": cuộc sống thật trước giờ học.
   Ở nhà với mẹ → chào hàng xóm → mua bánh sáng → giúp du khách hỏi đường → qua đường với chú bảo vệ → cổng trường.
   Mỗi nơi 3 tình huống × 5 lượt, mở ngay từ ngày đầu (không cần qua phòng học).
   Nhân vật ghép từ các lớp hình có sẵn (av: áo, mặt, tóc, màu tóc) nên không cần ảnh riêng. {name} = tên người chơi. */
var G = window.G || (window.G = {});

(function () {
  // world.js tạo G.NPCS sau file này, nên ghi vào G.NPC_MORE rồi world.js gộp vào
  var N = G.NPC_MORE || (G.NPC_MORE = {});
  N.mom = { img: 'npc_mom.png', name: 'Mom', vi: 'Mẹ', av: { ao: 'sweater', mat: 'gentle', toc: 'bun', mauToc: '#5b3a29' }, role: 'Mẹ của bạn' };
  N.ben = { img: 'npc_ben.png', name: 'Mr. Ben', av: { ao: 'jacket', mat: 'calm', toc: 'sidepart', mauToc: '#e9e6df' }, role: 'Hàng xóm' };
  N.mia = { img: 'npc_mia.png', name: 'Mia', av: { ao: 'uniform', mat: 'smile', toc: 'ponytail', mauToc: '#c9893e' }, role: 'Chủ xe bánh Sunny' };
  N.carlos = { img: 'npc_carlos.png', name: 'Carlos', av: { ao: 'tech', mat: 'sparkle', toc: 'curly', mauToc: '#2a2220' }, role: 'Du khách' };
  N.dan = { img: 'npc_dan.png', name: 'Officer Dan', av: { ao: 'sport', mat: 'cool', toc: 'spiky', mauToc: '#8a5a3b' }, role: 'Chú bảo vệ qua đường' };
  N.nora = { img: 'npc_nora.png', name: 'Ms. Nora', av: { ao: 'sweater', mat: 'calm', toc: 'long', mauToc: '#2a2220' }, role: 'Bàn tiếp đón ở cổng trường' };

  var L = G.LIFE || (G.LIFE = {});
  L['en-home'] = {
    lang: 'en', title: 'Ở nhà với mẹ', npc: 'mom', morning: 1,
    talks: [
      { title: 'Thức dậy', turns: [
        { npc: 'Rise and shine! It\'s seven already.', vi: 'Dậy đi con! Bảy giờ rồi đó.', ok: 'Five more minutes, Mom...' },
        { npc: 'No way. You\'ll be late for school.', vi: 'Không được. Con sẽ trễ học đó.', ok: 'Okay, okay. I\'m up.' },
        { npc: 'Did you sleep well?', vi: 'Con ngủ ngon không?', ok: 'Not really. I stayed up too late.' },
        { npc: 'Go wash your face and brush your teeth.', vi: 'Đi rửa mặt, đánh răng đi.', ok: 'Is the bathroom free?' },
        { npc: 'Yep, your dad just got out.', vi: 'Ừ, bố con vừa ra.', ok: 'Great, I\'ll be quick.' }
      ] },
      { title: 'Bữa sáng', turns: [
        { npc: 'Breakfast is ready! Come and eat.', vi: 'Bữa sáng xong rồi! Ra ăn đi.', ok: 'Coming! What are we having?' },
        { npc: 'Eggs and toast. Want some juice?', vi: 'Trứng với bánh mì nướng. Uống nước ép không?', ok: 'Yes, please. Orange juice.' },
        { npc: 'Here you go. Don\'t eat too fast.', vi: 'Đây. Đừng ăn nhanh quá.', ok: 'Can you pass me the butter?' },
        { npc: 'Sure. Do you have a test today?', vi: 'Đây. Hôm nay con có bài kiểm tra không?', ok: 'Yeah, a small quiz in English.' },
        { npc: 'You\'ll do great. You studied hard.', vi: 'Con sẽ làm tốt thôi. Con học chăm mà.', ok: 'Thanks, Mom. I hope so.' }
      ] },
      { title: 'Trước khi ra khỏi nhà', turns: [
        { npc: 'Got everything? Your bag, your phone?', vi: 'Đủ đồ chưa? Cặp, điện thoại?', ok: 'Yep, I\'ve got everything.' },
        { npc: 'Take an umbrella. It might rain later.', vi: 'Mang ô theo. Lát nữa có thể mưa.', ok: 'Okay, I\'ll take one.' },
        { npc: 'Here\'s some money for lunch.', vi: 'Tiền ăn trưa của con nè.', ok: 'Thanks, Mom!' },
        { npc: 'What time will you be home?', vi: 'Mấy giờ con về?', ok: 'Around four thirty.' },
        { npc: 'Text me when you get to school.', vi: 'Tới trường thì nhắn mẹ nhé.', ok: 'I will. Bye, Mom! Love you.' }
      ] }
    ]
  };
  L['en-neighbor'] = {
    lang: 'en', title: 'Ông Ben hàng xóm', npc: 'ben', morning: 2,
    talks: [
      { title: 'Chào hàng xóm', turns: [
        { npc: 'Morning, {name}! Off to school?', vi: 'Chào cháu {name}! Đi học hả?', ok: 'Morning, Mr. Ben! Yes, I am.' },
        { npc: 'You\'re up early today.', vi: 'Hôm nay dậy sớm nhỉ.', ok: 'I have class at eight thirty.' },
        { npc: 'Good for you. How are your parents?', vi: 'Giỏi lắm. Bố mẹ cháu khoẻ không?', ok: 'They\'re good, thanks. How about you?' },
        { npc: 'Can\'t complain. My knee hurts a little, that\'s all.', vi: 'Cũng ổn. Chỉ hơi đau đầu gối thôi.', ok: 'Oh no. Take care of yourself.' },
        { npc: 'I will. Have a good day at school!', vi: 'Ừ. Đi học vui nhé!', ok: 'Thanks! You too.' }
      ] },
      { title: 'Chuyện thời tiết', turns: [
        { npc: 'Chilly this morning, isn\'t it?', vi: 'Sáng nay se lạnh nhỉ?', ok: 'Yeah, it\'s colder than yesterday.' },
        { npc: 'They say it\'ll rain this afternoon.', vi: 'Nghe nói chiều nay mưa đó.', ok: 'Really? Then I\'ll need my raincoat.' },
        { npc: 'Did you hear about the storm next week?', vi: 'Cháu nghe tin cơn bão tuần sau chưa?', ok: 'No, I didn\'t. Is it going to be bad?' },
        { npc: 'Pretty bad. Lots of wind.', vi: 'Khá mạnh đó. Gió to lắm.', ok: 'I\'ll tell my parents.' },
        { npc: 'Good idea. Stay safe, kid.', vi: 'Ý hay đó. Giữ an toàn nhé cháu.', ok: 'You too, Mr. Ben.' }
      ] },
      { title: 'Nhờ giúp một việc', turns: [
        { npc: 'Hey, {name}, can I ask you a favor?', vi: '{name} ơi, nhờ cháu một việc được không?', ok: 'Sure, what is it?' },
        { npc: 'I\'m going away this weekend. Could you water my plants?', vi: 'Cuối tuần này bác đi vắng. Cháu tưới cây giúp bác nhé?', ok: 'No problem. How often?' },
        { npc: 'Once a day, in the morning.', vi: 'Mỗi ngày một lần, vào buổi sáng.', ok: 'Got it. Where\'s the key?' },
        { npc: 'Under the mat by the front door.', vi: 'Dưới tấm thảm cạnh cửa trước.', ok: 'Okay. Have a nice trip!' },
        { npc: 'Thanks a lot. I\'ll bring you something back.', vi: 'Cảm ơn cháu nhiều. Bác sẽ mua quà về cho.', ok: 'You don\'t have to, but thanks!' }
      ] }
    ]
  };
  L['en-bakery'] = {
    lang: 'en', title: 'Xe bánh Sunny', npc: 'mia', morning: 3,
    talks: [
      { title: 'Mua bữa sáng', turns: [
        { npc: 'Good morning! What can I get you?', vi: 'Chào buổi sáng! Bạn lấy gì?', ok: 'Hi! What\'s good today?' },
        { npc: 'The blueberry muffins just came out of the oven.', vi: 'Bánh muffin việt quất vừa ra lò.', ok: 'Great, I\'ll take one.' },
        { npc: 'Anything to drink?', vi: 'Uống gì không?', ok: 'A small hot chocolate, please.' },
        { npc: 'Do you want whipped cream on top?', vi: 'Có thêm kem tươi lên trên không?', ok: 'No, thanks.' },
        { npc: 'Okay, give me two minutes.', vi: 'Được, chờ mình hai phút nhé.', ok: 'Sure, no rush.' }
      ] },
      { title: 'Trả tiền', turns: [
        { npc: 'That\'s five twenty-five.', vi: 'Của bạn năm đô hai mươi lăm.', ok: 'Can I pay by card?' },
        { npc: 'Of course. Just tap here.', vi: 'Được chứ. Chạm thẻ vào đây.', ok: 'Okay. Did it go through?' },
        { npc: 'Yep, all done. Do you need a receipt?', vi: 'Xong rồi. Bạn cần hoá đơn không?', ok: 'No, I\'m good. Thanks.' },
        { npc: 'Do you have a loyalty card?', vi: 'Bạn có thẻ tích điểm không?', ok: 'No. How does it work?' },
        { npc: 'Buy nine, get the tenth one free.', vi: 'Mua chín cái, cái thứ mười miễn phí.', ok: 'Nice! I\'ll get one.' }
      ] },
      { title: 'Hết món', turns: [
        { npc: 'Sorry, we\'re out of croissants today.', vi: 'Xin lỗi, hôm nay hết bánh sừng bò rồi.', ok: 'Oh no. What do you recommend?' },
        { npc: 'The banana bread is really popular.', vi: 'Bánh mì chuối bán chạy lắm.', ok: 'Is it sweet?' },
        { npc: 'A little. It\'s my grandma\'s recipe.', vi: 'Hơi ngọt. Công thức của bà mình đó.', ok: 'Okay, I\'ll try a slice.' },
        { npc: 'Want me to heat it up?', vi: 'Mình hâm nóng cho bạn nhé?', ok: 'Yes, please.' },
        { npc: 'Here you go. Enjoy!', vi: 'Của bạn đây. Ăn ngon nhé!', ok: 'Thanks. Have a great day!' }
      ] }
    ]
  };
  L['en-tourist'] = {
    lang: 'en', title: 'Du khách hỏi đường', npc: 'carlos', morning: 4,
    talks: [
      { title: 'Chỉ đường tới ga tàu', turns: [
        { npc: 'Excuse me, do you speak English?', vi: 'Xin lỗi, bạn nói tiếng Anh không?', ok: 'Yes, a little. Can I help you?' },
        { npc: 'I\'m looking for the train station.', vi: 'Mình đang tìm ga tàu.', ok: 'It\'s not far. Go straight down this street.' },
        { npc: 'Straight down here?', vi: 'Đi thẳng đường này hả?', ok: 'Yes, then turn right at the corner.' },
        { npc: 'Is it a long walk?', vi: 'Đi bộ có xa không?', ok: 'No, about five minutes.' },
        { npc: 'Thank you so much!', vi: 'Cảm ơn bạn nhiều lắm!', ok: 'You\'re welcome. Have a nice day!' }
      ] },
      { title: 'Hỏi đường tới thư viện', turns: [
        { npc: 'Hi, sorry to bother you. Where\'s the City Library?', vi: 'Chào, xin lỗi làm phiền. Thư viện thành phố ở đâu vậy?', ok: 'You can take the number seven bus.' },
        { npc: 'Where\'s the bus stop?', vi: 'Bến xe buýt ở đâu?', ok: 'It\'s right over there, next to the park.' },
        { npc: 'How many stops is it?', vi: 'Đi mấy trạm?', ok: 'Just two stops.' },
        { npc: 'Do I need a ticket?', vi: 'Có cần vé không?', ok: 'Yes, you can buy one on the bus.' },
        { npc: 'Great. You\'ve been really helpful.', vi: 'Tuyệt. Bạn giúp mình nhiều lắm.', ok: 'No problem. Enjoy your visit!' }
      ] },
      { title: 'Nhờ chụp ảnh', turns: [
        { npc: 'Excuse me, could you take a picture of us?', vi: 'Xin lỗi, bạn chụp giúp tụi mình một tấm ảnh được không?', ok: 'Sure! Which button do I press?' },
        { npc: 'Just this big one here.', vi: 'Nút to này nè.', ok: 'Okay. Ready? Say cheese!' },
        { npc: 'Can you take one more, with the tower behind us?', vi: 'Chụp thêm một tấm có cái tháp phía sau được không?', ok: 'Of course. Move a little to the left.' },
        { npc: 'Like this?', vi: 'Thế này hả?', ok: 'Perfect. Here\'s your phone.' },
        { npc: 'Thanks! Are you from around here?', vi: 'Cảm ơn nha! Bạn là người ở đây hả?', ok: 'Not really. I\'m from Vietnam.' }
      ] }
    ]
  };
  L['en-crossing'] = {
    lang: 'en', title: 'Qua đường với Officer Dan', npc: 'dan', morning: 5,
    talks: [
      { title: 'Qua đường an toàn', turns: [
        { npc: 'Morning! Wait for the green light, okay?', vi: 'Chào cháu! Đợi đèn xanh nhé?', ok: 'Okay. Thanks for the reminder.' },
        { npc: 'Look both ways before you cross.', vi: 'Nhìn hai bên trước khi qua đường.', ok: 'Got it.' },
        { npc: 'And put your phone away when you walk.', vi: 'Và cất điện thoại khi đi bộ nhé.', ok: 'Sorry, I\'ll put it in my bag.' },
        { npc: 'Good. Okay, it\'s green now. Go ahead.', vi: 'Tốt. Đèn xanh rồi đó. Đi đi.', ok: 'Thanks! Have a good one.' },
        { npc: 'You too. Stay safe!', vi: 'Cháu cũng vậy. Đi cẩn thận!', ok: 'I will.' }
      ] },
      { title: 'Đường bị chặn', turns: [
        { npc: 'Sorry, this road is closed today.', vi: 'Xin lỗi, hôm nay đường này bị chặn.', ok: 'Oh. Why is it closed?' },
        { npc: 'They\'re fixing the water pipes.', vi: 'Người ta đang sửa ống nước.', ok: 'How do I get to the bus stop, then?' },
        { npc: 'Take the path through the park.', vi: 'Đi đường xuyên qua công viên.', ok: 'Is it much longer?' },
        { npc: 'Only a couple of minutes.', vi: 'Chỉ thêm vài phút thôi.', ok: 'Okay, thanks for your help.' },
        { npc: 'No problem. Mind the puddles!', vi: 'Không có gì. Coi chừng vũng nước nhé!', ok: 'Will do!' }
      ] },
      { title: 'Đang trễ học', turns: [
        { npc: 'You look like you\'re in a hurry.', vi: 'Trông cháu có vẻ đang vội.', ok: 'Yeah, I\'m running late for school.' },
        { npc: 'Don\'t run across the road, though.', vi: 'Nhưng đừng chạy băng qua đường nhé.', ok: 'I know, I know.' },
        { npc: 'What time does school start?', vi: 'Mấy giờ vào học?', ok: 'At eight thirty. It\'s eight fifteen now.' },
        { npc: 'You\'ve still got time. Take the next bus.', vi: 'Vẫn kịp mà. Đón chuyến xe tiếp theo đi.', ok: 'You\'re right. Thanks.' },
        { npc: 'Good luck at school!', vi: 'Học tốt nhé!', ok: 'Thanks, Officer Dan!' }
      ] }
    ]
  };
  L['en-gate'] = {
    lang: 'en', title: 'Cổng trường', npc: 'nora', morning: 6,
    talks: [
      { title: 'Quên thẻ học sinh', turns: [
        { npc: 'Good morning. Can I see your student card?', vi: 'Chào buổi sáng. Cho cô xem thẻ học sinh nhé?', ok: 'Oh no, I think I left it at home.' },
        { npc: 'That\'s okay. What\'s your name?', vi: 'Không sao. Em tên gì?', ok: 'My name\'s {name}.' },
        { npc: 'And what class are you in?', vi: 'Em học lớp nào?', ok: 'I\'m in class A1.' },
        { npc: 'Okay, I found you. Here\'s a day pass.', vi: 'Được rồi, cô tìm thấy em rồi. Thẻ tạm trong ngày đây.', ok: 'Thank you so much.' },
        { npc: 'Try not to forget it tomorrow!', vi: 'Mai đừng quên nữa nhé!', ok: 'I won\'t. Sorry about that.' }
      ] },
      { title: 'Đến muộn', turns: [
        { npc: 'You\'re a bit late this morning.', vi: 'Sáng nay em đến hơi muộn đó.', ok: 'Sorry, the bus was late.' },
        { npc: 'It happens. Sign your name here, please.', vi: 'Chuyện bình thường. Ký tên vào đây nhé.', ok: 'Sure. Do I write the time too?' },
        { npc: 'Yes, please. It\'s eight forty.', vi: 'Có. Bây giờ là tám giờ bốn mươi.', ok: 'Okay, done.' },
        { npc: 'Your class is on the first floor.', vi: 'Lớp em ở tầng một.', ok: 'Thanks. Can I go in now?' },
        { npc: 'Yes, go ahead. Quietly, please.', vi: 'Được, vào đi. Nhẹ nhàng thôi nhé.', ok: 'Okay. Thanks, Ms. Nora.' }
      ] },
      { title: 'Hỏi thông tin', turns: [
        { npc: 'Hi there! How can I help you?', vi: 'Chào em! Cô giúp gì được em?', ok: 'Where can I find the library?' },
        { npc: 'It\'s at the end of the hall, on the left.', vi: 'Ở cuối hành lang, bên trái.', ok: 'What time does it close?' },
        { npc: 'At five o\'clock today.', vi: 'Hôm nay đóng cửa lúc năm giờ.', ok: 'Can I borrow books there?' },
        { npc: 'Sure, you just need your student card.', vi: 'Được, em chỉ cần thẻ học sinh.', ok: 'Great. Thanks for your help!' },
        { npc: 'Anytime. Have a great day!', vi: 'Lúc nào cũng được. Chúc em một ngày tốt lành!', ok: 'You too!' }
      ] }
    ]
  };

  /* Người đứng trên bản đồ: nói chuyện ngay tại chỗ (không cần vào nhà). x, y: chân; dir: hướng nhìn */
  G.PEOPLE = {
    home_en: [
      { npc: 'ben', life: 'en-neighbor', x: 560, y: 800, dir: 'left' },
      { npc: 'mia', life: 'en-bakery', x: 1010, y: 300, dir: 'down', stall: 'Xe bánh Sunny' },
      { npc: 'carlos', life: 'en-tourist', x: 960, y: 760, dir: 'left' },
      { npc: 'dan', life: 'en-crossing', x: 1080, y: 520, dir: 'down' }
    ],
    city_en: [
      { npc: 'nora', life: 'en-gate', x: 600, y: 930, dir: 'left' }
    ]
  };
})();
