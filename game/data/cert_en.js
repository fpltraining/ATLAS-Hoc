/* Chứng chỉ ConnectLife (anh Han chốt 21/11/2026): mỗi tầng học xong nhận CHỨNG CHỈ, không gọi là tốt nghiệp.
   "Tốt nghiệp ConnectLife" chỉ dành cho người qua Bài thi đầu ra giao tiếp ở cuối lộ trình (sau Tầng 4).
   Thi chứng chỉ một tầng có 2 phần:
     Phần 1 · Hiểu: 20 câu trắc nghiệm (đạt từ 16/20), như trước.
     Phần 2 · Nói: 5 tình huống thật, tự nói bằng câu của mình (micro hoặc gõ), chấm theo ý chính; trung bình từ 60/100 là đạt.
   Mỗi tình huống: npc, sit (tình huống, tiếng Việt), q (người kia hỏi), vi (nghĩa), need (các ý cần có, mỗi ý vài cách nói), sample (câu mẫu). */
var G = window.G || (window.G = {});

(function () {
  G.CERT_SPEAK = {
    'en-n-test': [
      { id: 'cert-n-1', npc: 'nora', sit: 'Ở cổng trường. Cô Nora hỏi tên bạn và bạn đến từ đâu.', q: 'Hi! What\'s your name, and where are you from?', vi: 'Chào! Bạn tên gì, đến từ đâu?',
        need: [['name', 'i am'], ['from']], sample: ['My name is Han. I\'m from Vietnam.', 'I\'m Han, and I\'m from Da Nang.'] },
      { id: 'cert-n-2', npc: 'mom', sit: 'Ở nhà. Mẹ hỏi sáng nay bạn muốn ăn gì, uống gì.', q: 'What do you want for breakfast?', vi: 'Sáng nay con muốn ăn gì?',
        need: [['want', 'like', 'have', 'eat'], ['bread', 'egg', 'eggs', 'rice', 'noodles', 'pho', 'banh mi', 'toast', 'cereal', 'fruit', 'sandwich'], ['milk', 'coffee', 'tea', 'juice', 'water', 'drink']],
        sample: ['I want bread and eggs, and a glass of milk.', 'I\'d like pho and some orange juice, please.'] },
      { id: 'cert-n-3', npc: 'mia', sit: 'Ở xe bánh. Hỏi giá một cái bánh rồi mua hai cái.', q: 'Hi! What can I get you today?', vi: 'Chào! Bạn muốn mua gì?',
        need: [['how much'], ['two', 'a couple'], ['please', 'thank', 'thanks']], sample: ['How much is the muffin? Two muffins, please.', 'How much are these? I\'ll take two, thank you.'] },
      { id: 'cert-n-4', npc: 'ben', sit: 'Hàng xóm hỏi gia đình bạn có mấy người, có những ai.', q: 'How many people are there in your family?', vi: 'Nhà bạn có mấy người?',
        need: [['two', 'three', 'four', 'five', 'six', 'seven', 'eight'], ['mother', 'mom', 'father', 'dad', 'parents', 'brother', 'sister', 'grandmother', 'grandfather', 'wife', 'husband']],
        sample: ['There are four people: my dad, my mom, my sister and me.', 'Five. My parents, my two brothers and me.'] },
      { id: 'cert-n-5', npc: 'dan', sit: 'Chú bảo vệ hỏi cuối tuần bạn thích làm gì.', q: 'What do you like to do on the weekend?', vi: 'Cuối tuần bạn thích làm gì?',
        need: [['like', 'love', 'enjoy', 'usually'], ['play', 'watch', 'read', 'go', 'cook', 'sleep', 'listen', 'swim', 'run', 'study', 'walk', 'shop', 'visit']],
        sample: ['I like to play football with my friends.', 'I usually watch movies and cook with my family.'] }
    ],
    'en-a1-test': [
      { id: 'cert-a1-1', npc: 'emma', sit: 'Gặp bạn mới trong lớp. Trả lời câu chào rồi hỏi lại tên bạn ấy.', q: 'Hey! I\'m Emma. How\'s it going?', vi: 'Chào! Mình là Emma. Dạo này sao rồi?',
        need: [['good', 'fine', 'great', 'not bad', 'okay', 'ok', 'well'], ['your name', 'who are you', 'nice to meet']], sample: ['Pretty good, thanks! I\'m Han. Nice to meet you.', 'Not bad, you? What\'s your name again?'] },
      { id: 'cert-a1-2', npc: 'sam', sit: 'Ở quán. Gọi một món ăn, một đồ uống và nói ăn ở đây hay mang đi.', q: 'Hi there! What can I get for you?', vi: 'Chào bạn! Bạn dùng gì?',
        need: [['have', 'get', 'like', 'want', 'take'], ['water', 'coffee', 'tea', 'juice', 'soda', 'milk', 'latte', 'smoothie', 'lemonade'], ['here', 'to go', 'take away']],
        sample: ['Can I get a chicken sandwich and an iced tea? For here, please.', 'I\'ll have the pasta and a latte, to go.'] },
      { id: 'cert-a1-3', npc: 'lily', sit: 'Cô Lily hỏi về gia đình bạn: có những ai, mọi người làm nghề gì.', q: 'Tell me about your family.', vi: 'Kể cô nghe về gia đình em đi.',
        need: [['mother', 'mom', 'father', 'dad', 'parents', 'brother', 'sister', 'wife', 'husband', 'son', 'daughter'], ['teacher', 'doctor', 'nurse', 'engineer', 'driver', 'farmer', 'worker', 'student', 'office', 'job', 'works', 'business', 'shop', 'retired']],
        sample: ['There are four of us. My dad is a driver and my mom is a nurse.', 'I live with my parents. My mom works in an office, and my brother is a student.'] },
      { id: 'cert-a1-4', npc: 'tom', sit: 'Thầy Tom hỏi một ngày bình thường của bạn: mấy giờ dậy, làm gì.', q: 'So, what\'s a normal day like for you?', vi: 'Một ngày bình thường của em thế nào?',
        need: [['get up', 'wake up', 'i wake', 'i get'], ['o\'clock', 'at', 'morning', 'am', 'thirty'], ['work', 'school', 'study', 'class', 'office', 'go']],
        sample: ['I get up at six. Then I go to school at seven.', 'I wake up at seven, have breakfast and go to work.'] },
      { id: 'cert-a1-5', npc: 'carlos', sit: 'Du khách hỏi đường tới quán cà phê. Chỉ đường ngắn gọn.', q: 'Excuse me, where\'s the café?', vi: 'Xin lỗi, quán cà phê ở đâu?',
        need: [['go', 'walk', 'turn'], ['straight', 'left', 'right'], ['next to', 'near', 'across', 'on the', 'there', 'corner', 'opposite']],
        sample: ['Go straight and turn right. It\'s next to the bank.', 'Walk straight. The café is on the left, near the fountain.'] }
    ],
    'en-a2-test': [
      { id: 'cert-a2-1', npc: 'owen', sit: 'Kể ngắn cuối tuần trước bạn làm gì (ít nhất hai việc, dùng thì quá khứ) và thấy thế nào.', q: 'How was your weekend? What did you do?', vi: 'Cuối tuần của em thế nào? Em đã làm gì?',
        need: [['went', 'visited', 'watched', 'played', 'stayed', 'cooked', 'met', 'saw', 'ate', 'had', 'cleaned', 'read'], ['then', 'after', 'and', 'also', 'later'], ['fun', 'good', 'great', 'nice', 'relaxing', 'tired', 'busy', 'boring', 'amazing', 'was']],
        sample: ['It was great! I visited my grandparents, and then we cooked dinner together.', 'Pretty relaxing. I stayed home, watched a movie and later met a friend for coffee.'] },
      { id: 'cert-a2-2', npc: 'ivy', sit: 'Rủ bạn đi xem phim cuối tuần này, hẹn ngày giờ và chỗ gặp.', q: 'Hey! Are you free this weekend?', vi: 'Này! Cuối tuần này bạn rảnh không?',
        need: [['want to', 'would you like', 'let\'s', 'how about', 'do you want', 'why don\'t we'], ['movie', 'cinema', 'film'], ['saturday', 'sunday', 'o\'clock', 'pm', 'at', 'meet']],
        sample: ['Yes! Do you want to see a movie on Saturday? Let\'s meet at the cinema at seven.', 'I am. How about a movie on Sunday afternoon? We can meet at three.'] },
      { id: 'cert-a2-3', npc: 'ivy', sit: 'Bạn có hẹn tối nay nhưng có việc đột xuất. Xin lỗi và xin dời sang hôm khác.', q: 'Hi! See you at six tonight, right?', vi: 'Chào! Sáu giờ tối nay gặp nhé?',
        need: [['sorry', 'afraid'], ['can\'t', 'cannot', 'make it', 'came up'], ['reschedule', 'another day', 'tomorrow', 'next', 'move', 'change', 'instead', 'rain check']],
        sample: ['I\'m so sorry, something came up. Can we reschedule for tomorrow?', 'I\'m afraid I can\'t make it tonight. Could we move it to Friday?'] },
      { id: 'cert-a2-4', npc: 'carlos', sit: 'Ở khách sạn: gọi lễ tân báo phòng không có nước nóng và nhờ cho người lên xem.', q: 'Front desk. How can I help you?', vi: 'Lễ tân xin nghe. Tôi giúp gì được ạ?',
        need: [['hot water', 'shower', 'no water'], ['room'], ['could you', 'can you', 'please', 'send', 'check', 'fix']],
        sample: ['Hi, this is room 305. There\'s no hot water. Could you send someone up, please?', 'Hello, the shower in my room isn\'t working. Can you check it, please?'] },
      { id: 'cert-a2-5', npc: 'grant', sit: 'Phỏng vấn xin việc: nói điểm mạnh và kinh nghiệm của bạn.', q: 'So, why should we hire you?', vi: 'Vậy vì sao chúng tôi nên nhận bạn?',
        need: [['good at', 'good with', 'strength', 'i can'], ['experience', 'years', 'worked', 'used to'], ['team', 'people', 'learn', 'hard', 'customers', 'problems']],
        sample: ['I\'m good at working with people, and I have two years of experience in sales.', 'I used to work as a tour guide, so I\'m good with customers. I\'m also a fast learner.'] }
    ]
  };

  /* Tầng 4 · B1 – B2: tình huống khó, phải nói dài hơn và có lý lẽ */
  G.CERT_SPEAK['en-b1-test'] = [
    { id: 'cert-b1-1', npc: 'zoe', sit: 'Kể một chuyện đáng nhớ đã xảy ra với bạn: lúc đó bạn đang làm gì, chuyện gì bất ngờ xảy ra, kết thúc ra sao và bạn thấy thế nào.', q: 'Tell me about a day you\'ll never forget.', vi: 'Kể cho mình nghe về một ngày bạn không bao giờ quên.',
      need: [['was', 'were', 'went', 'had', 'happened', 'got', 'saw', 'met'], ['suddenly', 'all of a sudden', 'then', 'when', 'while', 'turned out'], ['in the end', 'finally', 'eventually', 'after that'], ['felt', 'feel', 'happy', 'scared', 'excited', 'surprised', 'amazing', 'never forget', 'relieved', 'proud']],
      sample: ['It was my first day in Hanoi. I was walking to the station when suddenly it started to pour. In the end, a stranger shared her umbrella with me. I felt so grateful.', 'Last year I went hiking with friends. While we were climbing, we got lost. Eventually we found the path, and I was really relieved.'] },
    { id: 'cert-b1-2', npc: 'ray', sit: 'Bạn mua tai nghe trên mạng, giao tới bị hỏng một bên. Gọi cửa hàng: nói rõ vấn đề, mã đơn, và yêu cầu đổi hoặc hoàn tiền.', q: 'Customer service, how can I help you today?', vi: 'Chăm sóc khách hàng xin nghe, tôi giúp gì được ạ?',
      need: [['problem', 'broken', 'doesn\'t work', 'not working', 'damaged'], ['order', 'number', 'bought', 'ordered'], ['refund', 'exchange', 'replacement', 'new one', 'replace']],
      sample: ['Hi, I\'m afraid there\'s a problem with my order. My order number is 4 7 2 1. The headphones arrived damaged, the left side doesn\'t work. I\'d like a replacement or a refund, please.', 'Hello, I ordered headphones last week, order number 5 5 3. One side is broken. Could I get a refund, please?'] },
    { id: 'cert-b1-3', npc: 'max', sit: 'Bạn muốn thuê căn hộ 500 đô một tháng, chủ nhà muốn 600. Thương lượng: đưa giá, lý do, và một điều kiện đổi lại.', q: 'The rent is six hundred a month. Is that okay for you?', vi: 'Tiền thuê là sáu trăm một tháng. Bạn thấy được không?',
      need: [['five hundred', 'five fifty', 'lower', 'less', 'discount', 'cheaper', 'flexibility'], ['because', 'since', 'the reason', 'market', 'budget', 'afford'], ['if', 'as long as', 'provided', 'in return', 'one year', 'longer contract', 'meet halfway']],
      sample: ['That\'s a bit more than my budget. Could you do it for five fifty? I can sign a one-year contract in return.', 'Six hundred is over my budget. If I paid three months in advance, would you accept five hundred and fifty? Let\'s meet halfway.'] },
    { id: 'cert-b1-4', npc: 'anna', sit: 'Thảo luận: làm việc ở nhà tốt hơn hay lên văn phòng tốt hơn? Nêu ý kiến, ưu và nhược điểm, cho ví dụ, rồi kết luận.', q: 'Do you think working from home is better than working in an office?', vi: 'Bạn nghĩ làm việc ở nhà có tốt hơn lên văn phòng không?',
      need: [['i think', 'in my opinion', 'i believe', 'personally', 'it seems'], ['on the one hand', 'on the other hand', 'however', 'but', 'downside', 'advantage', 'whereas'], ['for example', 'for instance', 'such as', 'take'], ['overall', 'to sum up', 'all in all', 'in the end', 'at the end of the day', 'so']],
      sample: ['In my opinion, working from home is better for most people. On the one hand, you save time, for example two hours of traffic a day. On the other hand, you can feel lonely. Overall, I\'d say a mix of both is best.', 'Personally, I prefer the office. However, working from home saves money, for instance on lunch and gas. To sum up, it depends on the job.'] },
    { id: 'cert-b1-5', npc: 'grant', sit: 'Đồng nghiệp đề xuất bỏ họp sáng thứ Hai. Bạn không đồng ý: phản biện lịch sự, nêu lý do và đưa phương án khác.', q: 'I think we should cancel the Monday meetings. They\'re a waste of time.', vi: 'Tôi nghĩ mình nên bỏ họp sáng thứ Hai. Tốn thời gian quá.',
      need: [['i see', 'that may be true', 'fair point', 'i understand', 'i take your point'], ['but', 'however', 'disagree', 'not sure'], ['because', 'since', 'the reason', 'that\'s why'], ['how about', 'what if', 'suggest', 'instead', 'shorter', 'maybe we could', 'why don\'t we']],
      sample: ['I see where you\'re coming from, but I don\'t really agree, because the meeting helps us plan the week. How about making it shorter, maybe fifteen minutes?', 'That may be true, however it\'s the only time the whole team talks. Instead of canceling it, why don\'t we change it to every two weeks?'] }
  ];

  /* tên phòng thi và lời mở đầu: thi chứng chỉ (không gọi là tốt nghiệp) */
  function patch(id, title, intro1) { var r = G.ROOMS[id]; if (!r) return; r.title = title; r.intro[1] = intro1; }
  patch('en-n-test', 'Thi chứng chỉ Nền tảng', 'Phần 1 · Hiểu: 20 câu lấy ngẫu nhiên trong 600 từ lõi (đạt từ 16/20). Phần 2 · Nói: 5 tình huống, tự nói bằng câu của bạn (trung bình từ 60/100). Đạt cả hai là nhận Chứng chỉ ConnectLife · Nền tảng và mở Tầng 2.');
  patch('en-a1-test', 'Thi chứng chỉ A1', 'Phần 1 · Hiểu: 20 câu lấy từ cả 4 phòng (đạt từ 16/20). Phần 2 · Nói: 5 tình huống đời thường, tự nói bằng câu của bạn (trung bình từ 60/100). Đạt cả hai là nhận Chứng chỉ ConnectLife · A1 và mở Tầng 3.');
  patch('en-a2-test', 'Thi chứng chỉ Tầng 3 · A2 – B1', 'Phần 1 · Hiểu: 20 câu lấy ngẫu nhiên trong 360 câu của 24 buổi (đạt từ 16/20). Phần 2 · Nói: 5 tình huống thật, tự nói bằng câu của bạn (trung bình từ 60/100). Đạt cả hai là nhận Chứng chỉ ConnectLife · A2 – B1.');

  /* Lộ trình tới đầu ra giao tiếp: mỗi tầng một chứng chỉ, cuối cùng là Tốt nghiệp ConnectLife.
     hours: số giờ học ước chừng để đạt bước đó (gồm bài học, ôn tập, luyện nói ngoài phố), tham khảo số giờ học có hướng dẫn
     cho từng cấp CEFR (từ 0 tới B1 khoảng 350 giờ, tới B2 khoảng 500 giờ), app tập trung giao tiếp nên tổng khoảng 460 giờ. */
  G.ROADMAP_EN = [
    { floor: 1, key: 'Nền tảng', name: 'Tầng 1 · Nền tảng', cefr: 'A0 → A1', hours: 60, out: 'Phát âm rõ, 600 từ lõi, nói câu ngắn về bản thân, gia đình, sở thích.' },
    { floor: 2, key: 'A1', name: 'Tầng 2 · A1', cefr: 'A1', hours: 50, out: 'Chào hỏi, giới thiệu, gọi món, mua đồ, hỏi và chỉ đường đơn giản.' },
    { floor: 3, key: 'A2 – B1', name: 'Tầng 3 · A2 – B1', cefr: 'A2 → B1', hours: 140, out: 'Kể chuyện đã qua, hẹn gặp, gọi điện, đi lại du lịch, đi khám, nói về công việc, nêu ý kiến.' },
    { floor: 4, key: 'B1 – B2', name: 'Tầng 4 · B1 – B2', cefr: 'B1 → B2', hours: 180, out: 'Nói tự nhiên 3 phút không ngắt, xử lý tình huống khó (khiếu nại, thương lượng), thảo luận có lý lẽ.' },
    { final: true, name: 'Tốt nghiệp ConnectLife', cefr: 'Đầu ra giao tiếp', hours: 30, out: 'Bài thi đầu ra: nói chuyện 5 phút với người lạ về đời sống, tự xử lý 5 tình huống không có gợi ý, nghe hiểu hội thoại tốc độ thật. Qua bài này mới gọi là tốt nghiệp.', soon: true }
  ];
})();
