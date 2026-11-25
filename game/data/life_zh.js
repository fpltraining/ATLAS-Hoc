/* Trường Lạc trấn 长乐镇: nói chuyện với người dân (tiếng Trung), cùng khuôn hội thoại ngoài phố của Brightford (js/life.js).
   8 nơi × 3 tình huống × 5 lượt. Người kia nói (npc, pinyin py, nghĩa vi); người học chọn câu đáp đúng (ok, okPy, okVi) rồi nói thành tiếng.
   Nơi mở dần theo bài HSK đã qua (unlock = buổi ở Học viện Hán ngữ). Chưa có bản đồ: mở từ Sảnh (Hội thoại) và nhiệm vụ Nói.
   Pinyin ghi biến điệu của 不 / 一 như sách giáo khoa (bú shì, yí ge). {name} = tên người học. Soạn 25/11/2026, cần người bản ngữ soát. */
var G = window.G || (window.G = {});
G.LIFE = G.LIFE || {};
G.NPCS = G.NPCS || {};

(function () {
  // người dân Trường Lạc trấn (hình chờ Đơn Q2, chưa có thì hiện nền giấy). Mã riêng: li / zhang / chen là thầy cô Học viện cũ (world.js)
  var P = {
    xiaomei: { name: '小美 Tiểu Mỹ', img: 'npc_xiaomei.png', role: 'Bạn cùng lớp, làm thêm ở quán trà sữa' },
    lin: { name: '林姐 Chị Lâm', img: 'npc_lin.png', role: 'Chủ quán trà' },
    nainai: { name: '李奶奶 Bà Lý', img: 'npc_nainai.png', role: 'Bán rau ở chợ sáng' },
    shifu: { name: '张师傅 Chú Trương', img: 'npc_shifu.png', role: 'Tài xế taxi' },
    zhao: { name: '赵医生 Bác sĩ Triệu', img: 'npc_zhao.png', role: 'Bác sĩ phòng khám' },
    yeye: { name: '陈爷爷 Ông Trần', img: 'npc_yeye.png', role: 'Ông cụ chơi cờ ở công viên' },
    zhou: { name: '周小姐 Cô Chu', img: 'npc_zhou.png', role: 'Nhân viên ga tàu cao tốc' }
  };
  for (var k in P) if (P.hasOwnProperty(k) && !G.NPCS[k]) G.NPCS[k] = P[k];

  // T(npc, py, vi, ok, okPy, okVi)
  function T(npc, py, vi, ok, okPy, okVi) { return { npc: npc, py: py, vi: vi, ok: ok, okPy: okPy, okVi: okVi }; }
  function place(id, o) { o.lang = 'zh'; G.LIFE[id] = o; }

  place('zh-school', { title: 'Học viện Hán ngữ · bạn cùng lớp', npc: 'xiaomei', scene: 'school_zh', unlock: 'zh-l002', unlockText: 'Qua bài 2 (你叫什么名字？) để mở.', talks: [
    { title: 'Làm quen bạn mới', turns: [
      T('你好！你是新同学吗？', 'Nǐ hǎo! Nǐ shì xīn tóngxué ma?', 'Chào bạn! Bạn là bạn học mới à?', '是的，我是新同学。', 'Shì de, wǒ shì xīn tóngxué.', 'Đúng vậy, mình là bạn học mới.'),
      T('我叫小美。你叫什么名字？', 'Wǒ jiào Xiǎoměi. Nǐ jiào shénme míngzi?', 'Mình tên Tiểu Mỹ. Bạn tên gì?', '我叫{name}。', 'Wǒ jiào {name}.', 'Mình tên {name}.'),
      T('你是哪国人？', 'Nǐ shì nǎ guó rén?', 'Bạn là người nước nào?', '我是越南人。', 'Wǒ shì Yuènán rén.', 'Mình là người Việt Nam.'),
      T('你学汉语多长时间了？', 'Nǐ xué Hànyǔ duō cháng shíjiān le?', 'Bạn học tiếng Trung bao lâu rồi?', '我刚开始学。', 'Wǒ gāng kāishǐ xué.', 'Mình mới bắt đầu học.'),
      T('加油！我们一起学习吧。', 'Jiāyóu! Wǒmen yìqǐ xuéxí ba.', 'Cố lên! Chúng mình cùng học nhé.', '好啊，谢谢你！', 'Hǎo a, xièxie nǐ!', 'Được đó, cảm ơn bạn!')
    ] },
    { title: 'Hỏi giờ học', turns: [
      T('你明天有汉语课吗？', 'Nǐ míngtiān yǒu Hànyǔ kè ma?', 'Mai bạn có tiết tiếng Trung không?', '有，我明天上午有课。', 'Yǒu, wǒ míngtiān shàngwǔ yǒu kè.', 'Có, sáng mai mình có tiết.'),
      T('几点上课？', 'Jǐ diǎn shàngkè?', 'Mấy giờ vào học?', '八点半上课。', 'Bā diǎn bàn shàngkè.', 'Tám rưỡi vào học.'),
      T('在哪个教室？', 'Zài nǎge jiàoshì?', 'Ở phòng học nào?', '在三楼的教室。', 'Zài sān lóu de jiàoshì.', 'Ở phòng học tầng ba.'),
      T('谁是你的老师？', 'Shéi shì nǐ de lǎoshī?', 'Ai là giáo viên của bạn?', '王老师是我的老师。', 'Wáng lǎoshī shì wǒ de lǎoshī.', 'Cô Vương là giáo viên của mình.'),
      T('王老师很好，你会喜欢她的。', 'Wáng lǎoshī hěn hǎo, nǐ huì xǐhuan tā de.', 'Cô Vương rất tốt, bạn sẽ thích cô ấy.', '太好了，明天见！', 'Tài hǎo le, míngtiān jiàn!', 'Tốt quá, mai gặp nhé!')
    ] },
    { title: 'Mượn sách', turns: [
      T('你在找什么？', 'Nǐ zài zhǎo shénme?', 'Bạn đang tìm gì vậy?', '我在找汉语书。', 'Wǒ zài zhǎo Hànyǔ shū.', 'Mình đang tìm sách tiếng Trung.'),
      T('我有一本，你要看吗？', 'Wǒ yǒu yì běn, nǐ yào kàn ma?', 'Mình có một quyển, bạn muốn đọc không?', '可以借我看看吗？', 'Kěyǐ jiè wǒ kànkan ma?', 'Cho mình mượn xem được không?'),
      T('当然可以。你什么时候还我？', 'Dāngrán kěyǐ. Nǐ shénme shíhou huán wǒ?', 'Tất nhiên được. Khi nào bạn trả mình?', '下个星期还你，可以吗？', 'Xià ge xīngqī huán nǐ, kěyǐ ma?', 'Tuần sau mình trả, được không?'),
      T('没问题。这本书有点儿难。', 'Méi wèntí. Zhè běn shū yǒudiǎnr nán.', 'Không vấn đề. Quyển này hơi khó đấy.', '没关系，我会查词典。', 'Méi guānxi, wǒ huì chá cídiǎn.', 'Không sao, mình sẽ tra từ điển.'),
      T('有问题可以问我。', 'Yǒu wèntí kěyǐ wèn wǒ.', 'Có gì không hiểu cứ hỏi mình.', '谢谢，你真好！', 'Xièxie, nǐ zhēn hǎo!', 'Cảm ơn, bạn tốt thật!')
    ] }
  ] });

  place('zh-teahouse', { title: 'Quán trà của chị Lâm', npc: 'lin', scene: 'teahouse_zh', unlock: 'zh-l009', unlockText: 'Qua bài 9 (吃饭) để mở quán trà.', talks: [
    { title: 'Gọi trà', turns: [
      T('欢迎光临！请问几位？', 'Huānyíng guānglín! Qǐngwèn jǐ wèi?', 'Hoan nghênh quý khách! Xin hỏi mấy người?', '就我一个人。', 'Jiù wǒ yí ge rén.', 'Chỉ mình tôi thôi.'),
      T('请坐。您想喝什么茶？', 'Qǐng zuò. Nín xiǎng hē shénme chá?', 'Mời ngồi. Quý khách muốn uống trà gì?', '我要一壶绿茶。', 'Wǒ yào yì hú lǜchá.', 'Cho tôi một ấm trà xanh.'),
      T('要热的还是冰的？', 'Yào rè de háishi bīng de?', 'Nóng hay đá ạ?', '热的，谢谢。', 'Rè de, xièxie.', 'Nóng, cảm ơn.'),
      T('还要别的吗？', 'Hái yào bié de ma?', 'Còn cần gì khác không ạ?', '不用了，就这些。', 'Búyòng le, jiù zhèxiē.', 'Không cần nữa, vậy thôi.'),
      T('好的，请稍等。', 'Hǎo de, qǐng shāo děng.', 'Vâng, xin chờ một chút.', '好，谢谢你。', 'Hǎo, xièxie nǐ.', 'Được, cảm ơn chị.')
    ] },
    { title: 'Gọi điểm tâm', turns: [
      T('我们有包子、饺子和点心。', 'Wǒmen yǒu bāozi, jiǎozi hé diǎnxin.', 'Quán có bánh bao, sủi cảo và điểm tâm.', '我想吃饺子。', 'Wǒ xiǎng chī jiǎozi.', 'Tôi muốn ăn sủi cảo.'),
      T('要几个？', 'Yào jǐ ge?', 'Lấy mấy cái ạ?', '十个，谢谢。', 'Shí ge, xièxie.', 'Mười cái, cảm ơn.'),
      T('要辣的吗？', 'Yào là de ma?', 'Có lấy cay không ạ?', '不要辣的。', 'Bú yào là de.', 'Không lấy cay.'),
      T('一共三十五块。', 'Yígòng sānshíwǔ kuài.', 'Tổng cộng ba mươi lăm tệ.', '可以用微信付吗？', 'Kěyǐ yòng Wēixìn fù ma?', 'Trả bằng WeChat được không?'),
      T('可以，请扫这个码。', 'Kěyǐ, qǐng sǎo zhège mǎ.', 'Được ạ, mời quét mã này.', '好的，付好了。', 'Hǎo de, fù hǎo le.', 'Vâng, trả xong rồi.')
    ] },
    { title: 'Trò chuyện với chị Lâm', turns: [
      T('你常来喝茶吗？', 'Nǐ cháng lái hē chá ma?', 'Bạn hay đến uống trà không?', '第一次来。', 'Dì yī cì lái.', 'Lần đầu tôi đến.'),
      T('你觉得我们的茶怎么样？', 'Nǐ juéde wǒmen de chá zěnmeyàng?', 'Bạn thấy trà ở đây thế nào?', '很好喝！', 'Hěn hǎohē!', 'Rất ngon!'),
      T('你是来旅游的吗？', 'Nǐ shì lái lǚyóu de ma?', 'Bạn đến du lịch à?', '不是，我来学汉语。', 'Bú shì, wǒ lái xué Hànyǔ.', 'Không, tôi đến học tiếng Trung.'),
      T('你的汉语说得真好！', 'Nǐ de Hànyǔ shuō de zhēn hǎo!', 'Tiếng Trung của bạn nói hay thật!', '哪里哪里，还差得远呢。', 'Nǎli nǎli, hái chà de yuǎn ne.', 'Đâu có, còn kém xa lắm.'),
      T('有空常来啊！', 'Yǒu kòng cháng lái a!', 'Rảnh thì ghé thường nhé!', '一定，再见！', 'Yídìng, zàijiàn!', 'Nhất định rồi, tạm biệt!')
    ] }
  ] });

  place('zh-market', { title: 'Chợ sáng của bà Lý', npc: 'nainai', scene: 'market_zh', unlock: 'zh-l010', unlockText: 'Qua bài 10 (买东西) để mở chợ.', talks: [
    { title: 'Mua táo', turns: [
      T('早！要买点儿什么？', 'Zǎo! Yào mǎi diǎnr shénme?', 'Chào sớm! Muốn mua gì nào?', '我想买苹果。', 'Wǒ xiǎng mǎi píngguǒ.', 'Cháu muốn mua táo.'),
      T('苹果五块钱一斤。', 'Píngguǒ wǔ kuài qián yì jīn.', 'Táo năm tệ một cân.', '我要两斤。', 'Wǒ yào liǎng jīn.', 'Cho cháu hai cân.'),
      T('好嘞！还要别的吗？', 'Hǎo lei! Hái yào bié de ma?', 'Được rồi! Còn lấy gì nữa không?', '再要一些香蕉。', 'Zài yào yìxiē xiāngjiāo.', 'Lấy thêm ít chuối nữa ạ.'),
      T('一共十五块。', 'Yígòng shíwǔ kuài.', 'Tổng cộng mười lăm tệ.', '给您二十块。', 'Gěi nín èrshí kuài.', 'Cháu gửi bà hai mươi tệ.'),
      T('找你五块，拿好。', 'Zhǎo nǐ wǔ kuài, ná hǎo.', 'Thối cháu năm tệ, cầm chắc nhé.', '谢谢奶奶！', 'Xièxie nǎinai!', 'Cháu cảm ơn bà!')
    ] },
    { title: 'Mặc cả', turns: [
      T('这些西瓜很甜，十块一个。', 'Zhèxiē xīguā hěn tián, shí kuài yí ge.', 'Dưa hấu này ngọt lắm, mười tệ một quả.', '太贵了，便宜一点儿吧。', 'Tài guì le, piányi yìdiǎnr ba.', 'Đắt quá, rẻ chút đi ạ.'),
      T('那八块吧。', 'Nà bā kuài ba.', 'Thế thì tám tệ vậy.', '七块可以吗？', 'Qī kuài kěyǐ ma?', 'Bảy tệ được không ạ?'),
      T('你买两个，我就卖七块。', 'Nǐ mǎi liǎng ge, wǒ jiù mài qī kuài.', 'Cháu mua hai quả thì bà bán bảy tệ.', '好，我买两个。', 'Hǎo, wǒ mǎi liǎng ge.', 'Được, cháu mua hai quả.'),
      T('要袋子吗？', 'Yào dàizi ma?', 'Có lấy túi không?', '要一个，谢谢。', 'Yào yí ge, xièxie.', 'Lấy một cái ạ, cảm ơn.'),
      T('下次再来啊！', 'Xià cì zài lái a!', 'Lần sau lại đến nhé!', '好的，奶奶再见！', 'Hǎo de, nǎinai zàijiàn!', 'Vâng, cháu chào bà!')
    ] },
    { title: 'Mua rau nấu cơm', turns: [
      T('今天的白菜很新鲜。', 'Jīntiān de báicài hěn xīnxiān.', 'Cải thảo hôm nay tươi lắm.', '白菜怎么卖？', 'Báicài zěnme mài?', 'Cải thảo bán thế nào ạ?'),
      T('三块钱一斤。', 'Sān kuài qián yì jīn.', 'Ba tệ một cân.', '我要一棵。', 'Wǒ yào yì kē.', 'Cháu lấy một cây.'),
      T('你会做饭吗？', 'Nǐ huì zuò fàn ma?', 'Cháu biết nấu cơm không?', '会一点儿。', 'Huì yìdiǎnr.', 'Biết một chút ạ.'),
      T('白菜和肉一起做，很好吃。', 'Báicài hé ròu yìqǐ zuò, hěn hǎochī.', 'Cải thảo nấu với thịt rất ngon.', '那我再买一点儿肉。', 'Nà wǒ zài mǎi yìdiǎnr ròu.', 'Vậy cháu mua thêm chút thịt.'),
      T('肉在那边，往前走就到了。', 'Ròu zài nàbiān, wǎng qián zǒu jiù dào le.', 'Thịt ở bên kia, đi thẳng là tới.', '好的，谢谢您！', 'Hǎo de, xièxie nín!', 'Vâng, cảm ơn bà!')
    ] }
  ] });

  place('zh-street', { title: 'Hỏi đường và đi taxi', npc: 'shifu', scene: 'street_zh', unlock: 'zh-l011', unlockText: 'Qua bài 11 (在哪儿？) để mở.', talks: [
    { title: 'Hỏi đường tới Học viện', turns: [
      T('你好，需要帮忙吗？', 'Nǐ hǎo, xūyào bāngmáng ma?', 'Chào cháu, cần giúp gì không?', '请问，汉语学院在哪儿？', 'Qǐngwèn, Hànyǔ xuéyuàn zài nǎr?', 'Xin hỏi, Học viện Hán ngữ ở đâu ạ?'),
      T('一直往前走，到路口往右拐。', 'Yìzhí wǎng qián zǒu, dào lùkǒu wǎng yòu guǎi.', 'Cứ đi thẳng, tới ngã tư thì rẽ phải.', '离这儿远吗？', 'Lí zhèr yuǎn ma?', 'Có xa đây không ạ?'),
      T('不远，走路十分钟。', 'Bù yuǎn, zǒulù shí fēnzhōng.', 'Không xa, đi bộ mười phút.', '在桥的旁边吗？', 'Zài qiáo de pángbiān ma?', 'Ở cạnh cây cầu ạ?'),
      T('对，就在石桥旁边。', 'Duì, jiù zài shíqiáo pángbiān.', 'Đúng, ngay cạnh cầu đá.', '明白了，谢谢您！', 'Míngbai le, xièxie nín!', 'Cháu hiểu rồi, cảm ơn chú!'),
      T('不客气，路上小心！', 'Bú kèqi, lùshang xiǎoxīn!', 'Không có gì, đi đường cẩn thận!', '好的，再见！', 'Hǎo de, zàijiàn!', 'Vâng, chào chú!')
    ] },
    { title: 'Đi taxi ra ga', turns: [
      T('你好，去哪儿？', 'Nǐ hǎo, qù nǎr?', 'Chào, đi đâu đây?', '我去火车站。', 'Wǒ qù huǒchēzhàn.', 'Cháu đi ga tàu.'),
      T('好的。你赶时间吗？', 'Hǎo de. Nǐ gǎn shíjiān ma?', 'Được. Cháu có vội không?', '有点儿急，我的火车十点开。', 'Yǒudiǎnr jí, wǒ de huǒchē shí diǎn kāi.', 'Hơi gấp ạ, tàu của cháu mười giờ chạy.'),
      T('别担心，二十分钟就到。', 'Bié dānxīn, èrshí fēnzhōng jiù dào.', 'Đừng lo, hai mươi phút là tới.', '太好了，谢谢师傅。', 'Tài hǎo le, xièxie shīfu.', 'Tốt quá, cảm ơn bác tài.'),
      T('到了，一共三十二块。', 'Dào le, yígòng sānshí\'èr kuài.', 'Tới rồi, tổng cộng ba mươi hai tệ.', '我用手机付钱。', 'Wǒ yòng shǒujī fù qián.', 'Cháu trả bằng điện thoại.'),
      T('好，收到了。一路顺风！', 'Hǎo, shōudào le. Yílù shùnfēng!', 'Được, nhận rồi. Thượng lộ bình an!', '谢谢，再见！', 'Xièxie, zàijiàn!', 'Cảm ơn, chào bác!')
    ] },
    { title: 'Đi tàu điện ngầm', turns: [
      T('你要坐地铁吗？', 'Nǐ yào zuò dìtiě ma?', 'Cháu định đi tàu điện ngầm à?', '对，我要去长乐公园。', 'Duì, wǒ yào qù Chánglè gōngyuán.', 'Vâng, cháu muốn đi công viên Trường Lạc.'),
      T('坐二号线，三站就到。', 'Zuò èr hào xiàn, sān zhàn jiù dào.', 'Đi tuyến số 2, ba trạm là tới.', '在哪儿买票？', 'Zài nǎr mǎi piào?', 'Mua vé ở đâu ạ?'),
      T('用手机扫码就可以进站。', 'Yòng shǒujī sǎo mǎ jiù kěyǐ jìn zhàn.', 'Quét mã bằng điện thoại là vào ga được.', '真方便！', 'Zhēn fāngbiàn!', 'Tiện thật!'),
      T('下车以后从B出口出去。', 'Xià chē yǐhòu cóng B chūkǒu chūqu.', 'Xuống tàu rồi ra cửa B.', 'B出口，我记住了。', 'B chūkǒu, wǒ jìzhù le.', 'Cửa B, cháu nhớ rồi.'),
      T('祝你玩儿得开心！', 'Zhù nǐ wánr de kāixīn!', 'Chúc cháu đi chơi vui!', '谢谢您！', 'Xièxie nín!', 'Cảm ơn chú!')
    ] }
  ] });

  place('zh-park', { title: 'Công viên · ông Trần', npc: 'yeye', scene: 'park_zh', unlock: 'zh-l015', unlockText: 'Qua bài 15 (今天天气怎么样？) để mở.', talks: [
    { title: 'Chào hỏi, nói chuyện thời tiết', turns: [
      T('年轻人，早啊！', 'Niánqīngrén, zǎo a!', 'Chào người trẻ, sớm thế!', '陈爷爷早！', 'Chén yéye zǎo!', 'Cháu chào ông Trần!'),
      T('今天天气真好啊。', 'Jīntiān tiānqì zhēn hǎo a.', 'Hôm nay trời đẹp thật.', '是啊，不冷也不热。', 'Shì a, bù lěng yě bú rè.', 'Vâng, không lạnh cũng không nóng.'),
      T('听说明天要下雨。', 'Tīngshuō míngtiān yào xià yǔ.', 'Nghe nói mai trời mưa.', '那我明天带伞。', 'Nà wǒ míngtiān dài sǎn.', 'Vậy mai cháu mang ô.'),
      T('你每天都来公园吗？', 'Nǐ měi tiān dōu lái gōngyuán ma?', 'Ngày nào cháu cũng đến công viên à?', '我早上常来跑步。', 'Wǒ zǎoshang cháng lái pǎobù.', 'Buổi sáng cháu hay đến chạy bộ.'),
      T('好习惯！年轻人要多运动。', 'Hǎo xíguàn! Niánqīngrén yào duō yùndòng.', 'Thói quen tốt! Người trẻ phải vận động nhiều.', '您说得对。', 'Nín shuō de duì.', 'Ông nói đúng ạ.')
    ] },
    { title: 'Chơi cờ tướng', turns: [
      T('你会下象棋吗？', 'Nǐ huì xià xiàngqí ma?', 'Cháu biết chơi cờ tướng không?', '会一点儿，不太好。', 'Huì yìdiǎnr, bú tài hǎo.', 'Biết một chút, không giỏi lắm.'),
      T('没关系，我们下一盘吧。', 'Méi guānxi, wǒmen xià yì pán ba.', 'Không sao, mình chơi một ván nhé.', '好啊，您先走。', 'Hǎo a, nín xiān zǒu.', 'Vâng, ông đi trước ạ.'),
      T('该你了。', 'Gāi nǐ le.', 'Tới lượt cháu rồi.', '让我想一想。', 'Ràng wǒ xiǎng yi xiǎng.', 'Để cháu nghĩ một chút.'),
      T('哈哈，你走得不错！', 'Hāha, nǐ zǒu de búcuò!', 'Haha, cháu đi nước hay đấy!', '是您教得好。', 'Shì nín jiāo de hǎo.', 'Là do ông dạy hay ạ.'),
      T('明天再来下棋！', 'Míngtiān zài lái xià qí!', 'Mai lại đến chơi cờ nhé!', '好，明天见！', 'Hǎo, míngtiān jiàn!', 'Vâng, mai gặp ạ!')
    ] },
    { title: 'Kế hoạch cuối tuần', turns: [
      T('这个周末你有什么打算？', 'Zhège zhōumò nǐ yǒu shénme dǎsuàn?', 'Cuối tuần này cháu có dự định gì?', '我想去看看古镇。', 'Wǒ xiǎng qù kànkan gǔzhèn.', 'Cháu muốn đi xem phố cổ.'),
      T('古镇很漂亮，有很多老房子。', 'Gǔzhèn hěn piàoliang, yǒu hěn duō lǎo fángzi.', 'Phố cổ đẹp lắm, có nhiều nhà cổ.', '坐船去好吗？', 'Zuò chuán qù hǎo ma?', 'Đi bằng thuyền có hay không ạ?'),
      T('好！坐船可以看到河边的风景。', 'Hǎo! Zuò chuán kěyǐ kàndào hébiān de fēngjǐng.', 'Hay! Đi thuyền ngắm được cảnh ven sông.', '坐船要多少钱？', 'Zuò chuán yào duōshao qián?', 'Đi thuyền mất bao nhiêu tiền ạ?'),
      T('大概三十块。', 'Dàgài sānshí kuài.', 'Khoảng ba mươi tệ.', '不贵，我一定去。', 'Bú guì, wǒ yídìng qù.', 'Không đắt, cháu nhất định đi.'),
      T('别忘了拍照！', 'Bié wàng le pāi zhào!', 'Đừng quên chụp ảnh nhé!', '我会给您看照片的。', 'Wǒ huì gěi nín kàn zhàopiàn de.', 'Cháu sẽ cho ông xem ảnh.')
    ] }
  ] });

  place('zh-station', { title: 'Ga tàu cao tốc', npc: 'zhou', scene: 'station_zh', unlock: 'zh-l022', unlockText: 'Qua bài 22 (坐火车) để mở ga tàu.', talks: [
    { title: 'Mua vé tàu', turns: [
      T('您好，请问去哪儿？', 'Nín hǎo, qǐngwèn qù nǎr?', 'Xin chào, quý khách đi đâu ạ?', '我要一张去上海的票。', 'Wǒ yào yì zhāng qù Shànghǎi de piào.', 'Cho tôi một vé đi Thượng Hải.'),
      T('今天还是明天？', 'Jīntiān háishi míngtiān?', 'Hôm nay hay ngày mai?', '今天下午的。', 'Jīntiān xiàwǔ de.', 'Chiều nay.'),
      T('下午两点有一趟高铁。', 'Xiàwǔ liǎng diǎn yǒu yí tàng gāotiě.', 'Hai giờ chiều có một chuyến tàu cao tốc.', '好，就要这趟。', 'Hǎo, jiù yào zhè tàng.', 'Được, lấy chuyến này.'),
      T('请出示您的护照。', 'Qǐng chūshì nín de hùzhào.', 'Xin cho xem hộ chiếu.', '给您，这是我的护照。', 'Gěi nín, zhè shì wǒ de hùzhào.', 'Gửi chị, đây là hộ chiếu của tôi.'),
      T('一共一百二十块。', 'Yígòng yìbǎi èrshí kuài.', 'Tổng cộng một trăm hai mươi tệ.', '我用微信付。', 'Wǒ yòng Wēixìn fù.', 'Tôi trả bằng WeChat.')
    ] },
    { title: 'Hỏi giờ tàu', turns: [
      T('请问有什么可以帮您？', 'Qǐngwèn yǒu shénme kěyǐ bāng nín?', 'Xin hỏi tôi có thể giúp gì ạ?', '去杭州的火车几点开？', 'Qù Hángzhōu de huǒchē jǐ diǎn kāi?', 'Tàu đi Hàng Châu mấy giờ chạy?'),
      T('下一趟是三点十分。', 'Xià yí tàng shì sān diǎn shí fēn.', 'Chuyến tiếp theo là ba giờ mười.', '要坐多长时间？', 'Yào zuò duō cháng shíjiān?', 'Đi mất bao lâu?'),
      T('大概一个小时。', 'Dàgài yí ge xiǎoshí.', 'Khoảng một tiếng.', '车上能买吃的吗？', 'Chē shang néng mǎi chī de ma?', 'Trên tàu mua đồ ăn được không?'),
      T('能，车上有餐车。', 'Néng, chē shang yǒu cānchē.', 'Được, trên tàu có toa ăn.', '太好了，谢谢！', 'Tài hǎo le, xièxie!', 'Tốt quá, cảm ơn!'),
      T('不客气，祝您旅途愉快！', 'Bú kèqi, zhù nín lǚtú yúkuài!', 'Không có gì, chúc quý khách chuyến đi vui vẻ!', '谢谢，再见！', 'Xièxie, zàijiàn!', 'Cảm ơn, tạm biệt!')
    ] },
    { title: 'Tìm sân ga', turns: [
      T('您的车在五号站台。', 'Nín de chē zài wǔ hào zhàntái.', 'Tàu của quý khách ở sân ga số 5.', '五号站台怎么走？', 'Wǔ hào zhàntái zěnme zǒu?', 'Sân ga số 5 đi thế nào?'),
      T('坐电梯下去，往左走。', 'Zuò diàntī xiàqu, wǎng zuǒ zǒu.', 'Đi thang máy xuống, rẽ trái.', '什么时候开始检票？', 'Shénme shíhou kāishǐ jiǎnpiào?', 'Khi nào bắt đầu soát vé?'),
      T('开车前十五分钟。', 'Kāichē qián shíwǔ fēnzhōng.', 'Mười lăm phút trước khi tàu chạy.', '现在可以进去吗？', 'Xiànzài kěyǐ jìnqu ma?', 'Bây giờ vào được không?'),
      T('还早呢，可以先在候车室等。', 'Hái zǎo ne, kěyǐ xiān zài hòuchēshì děng.', 'Còn sớm, có thể chờ ở phòng chờ trước.', '候车室在哪儿？', 'Hòuchēshì zài nǎr?', 'Phòng chờ ở đâu?'),
      T('就在你的右边。', 'Jiù zài nǐ de yòubian.', 'Ngay bên phải bạn.', '看到了，谢谢！', 'Kàndào le, xièxie!', 'Thấy rồi, cảm ơn!')
    ] }
  ] });

  place('zh-clinic', { title: 'Phòng khám · bác sĩ Triệu', npc: 'zhao', scene: 'clinic_zh', unlock: 'zh-l023', unlockText: 'Qua bài 23 (有点儿不舒服) để mở phòng khám.', talks: [
    { title: 'Khám bệnh', turns: [
      T('你好，哪里不舒服？', 'Nǐ hǎo, nǎli bù shūfu?', 'Chào bạn, bạn thấy khó chịu ở đâu?', '我头疼，还有点儿发烧。', 'Wǒ tóu téng, hái yǒudiǎnr fāshāo.', 'Tôi đau đầu, còn hơi sốt.'),
      T('什么时候开始的？', 'Shénme shíhou kāishǐ de?', 'Bắt đầu từ khi nào?', '昨天晚上开始的。', 'Zuótiān wǎnshang kāishǐ de.', 'Từ tối hôm qua.'),
      T('我看看。嗓子疼不疼？', 'Wǒ kànkan. Sǎngzi téng bu téng?', 'Để tôi xem. Họng có đau không?', '有一点儿疼。', 'Yǒu yìdiǎnr téng.', 'Hơi đau một chút.'),
      T('是感冒了，不太严重。', 'Shì gǎnmào le, bú tài yánzhòng.', 'Bị cảm rồi, không nghiêm trọng lắm.', '我需要吃药吗？', 'Wǒ xūyào chī yào ma?', 'Tôi có cần uống thuốc không?'),
      T('吃点儿药，多喝水，多休息。', 'Chī diǎnr yào, duō hē shuǐ, duō xiūxi.', 'Uống chút thuốc, uống nhiều nước, nghỉ ngơi nhiều.', '好的，谢谢医生。', 'Hǎo de, xièxie yīshēng.', 'Vâng, cảm ơn bác sĩ.')
    ] },
    { title: 'Lấy thuốc', turns: [
      T('这是你的药。', 'Zhè shì nǐ de yào.', 'Đây là thuốc của bạn.', '这个药怎么吃？', 'Zhège yào zěnme chī?', 'Thuốc này uống thế nào?'),
      T('一天三次，一次两片。', 'Yì tiān sān cì, yí cì liǎng piàn.', 'Một ngày ba lần, mỗi lần hai viên.', '饭前吃还是饭后吃？', 'Fàn qián chī háishi fàn hòu chī?', 'Uống trước hay sau bữa ăn?'),
      T('饭后吃。', 'Fàn hòu chī.', 'Uống sau bữa ăn.', '要吃几天？', 'Yào chī jǐ tiān?', 'Phải uống mấy ngày?'),
      T('先吃三天。', 'Xiān chī sān tiān.', 'Uống trước ba ngày.', '一共多少钱？', 'Yígòng duōshao qián?', 'Tổng cộng bao nhiêu tiền?'),
      T('四十八块。', 'Sìshíbā kuài.', 'Bốn mươi tám tệ.', '好的，给你。', 'Hǎo de, gěi nǐ.', 'Vâng, gửi bác sĩ.')
    ] },
    { title: 'Tái khám', turns: [
      T('你好，好点儿了吗？', 'Nǐ hǎo, hǎo diǎnr le ma?', 'Chào bạn, đỡ hơn chưa?', '好多了，不发烧了。', 'Hǎo duō le, bù fāshāo le.', 'Đỡ nhiều rồi, hết sốt rồi.'),
      T('晚上睡得怎么样？', 'Wǎnshang shuì de zěnmeyàng?', 'Buổi tối ngủ thế nào?', '睡得很好。', 'Shuì de hěn hǎo.', 'Ngủ rất ngon.'),
      T('还咳嗽吗？', 'Hái késou ma?', 'Còn ho không?', '还有一点儿。', 'Hái yǒu yìdiǎnr.', 'Còn một chút.'),
      T('没关系，再吃两天药就好了。', 'Méi guānxi, zài chī liǎng tiān yào jiù hǎo le.', 'Không sao, uống thêm hai ngày thuốc là khỏi.', '我可以去上课吗？', 'Wǒ kěyǐ qù shàngkè ma?', 'Tôi đi học được không?'),
      T('可以，但是别太累了。', 'Kěyǐ, dànshì bié tài lèi le.', 'Được, nhưng đừng để mệt quá.', '知道了，谢谢您！', 'Zhīdào le, xièxie nín!', 'Biết rồi ạ, cảm ơn bác sĩ!')
    ] }
  ] });

  place('zh-store', { title: 'Quán trà sữa và cửa hàng tiện lợi', npc: 'xiaomei', scene: 'store_zh', unlock: 'zh-l030', unlockText: 'Qua bài 30 (买卖和数字) để mở.', talks: [
    { title: 'Gọi trà sữa', turns: [
      T('欢迎！今天想喝什么？', 'Huānyíng! Jīntiān xiǎng hē shénme?', 'Chào mừng! Hôm nay muốn uống gì?', '我要一杯珍珠奶茶。', 'Wǒ yào yì bēi zhēnzhū nǎichá.', 'Cho mình một ly trà sữa trân châu.'),
      T('要大杯还是中杯？', 'Yào dà bēi háishi zhōng bēi?', 'Ly lớn hay ly vừa?', '大杯。', 'Dà bēi.', 'Ly lớn.'),
      T('甜度呢？正常糖还是半糖？', 'Tiándù ne? Zhèngcháng táng háishi bàn táng?', 'Độ ngọt thì sao? Đường bình thường hay nửa đường?', '半糖，少冰。', 'Bàn táng, shǎo bīng.', 'Nửa đường, ít đá.'),
      T('好的，一共十六块。', 'Hǎo de, yígòng shíliù kuài.', 'Được, tổng cộng mười sáu tệ.', '我扫你的码。', 'Wǒ sǎo nǐ de mǎ.', 'Mình quét mã của bạn nhé.'),
      T('好了，请稍等五分钟。', 'Hǎo le, qǐng shāo děng wǔ fēnzhōng.', 'Xong rồi, chờ năm phút nhé.', '没问题，谢谢！', 'Méi wèntí, xièxie!', 'Không vấn đề, cảm ơn!')
    ] },
    { title: 'Mua đồ ở cửa hàng tiện lợi', turns: [
      T('你好，需要袋子吗？', 'Nǐ hǎo, xūyào dàizi ma?', 'Chào bạn, cần túi không?', '不用，我有袋子。', 'Búyòng, wǒ yǒu dàizi.', 'Không cần, mình có túi rồi.'),
      T('这瓶水和面包，一共九块五。', 'Zhè píng shuǐ hé miànbāo, yígòng jiǔ kuài wǔ.', 'Chai nước này và bánh mì, tổng cộng chín tệ rưỡi.', '可以刷卡吗？', 'Kěyǐ shuā kǎ ma?', 'Quẹt thẻ được không?'),
      T('可以，也可以用支付宝。', 'Kěyǐ, yě kěyǐ yòng Zhīfùbǎo.', 'Được, cũng có thể dùng Alipay.', '那我用支付宝。', 'Nà wǒ yòng Zhīfùbǎo.', 'Vậy mình dùng Alipay.'),
      T('要不要热一下面包？', 'Yào bu yào rè yíxià miànbāo?', 'Có muốn hâm nóng bánh mì không?', '好的，麻烦你了。', 'Hǎo de, máfan nǐ le.', 'Vâng, phiền bạn nhé.'),
      T('不麻烦，给你。', 'Bù máfan, gěi nǐ.', 'Không phiền đâu, của bạn đây.', '谢谢，再见！', 'Xièxie, zàijiàn!', 'Cảm ơn, tạm biệt!')
    ] },
    { title: 'Trò chuyện với Tiểu Mỹ', turns: [
      T('咦，{name}？你也来买奶茶啊！', 'Yí, {name}? Nǐ yě lái mǎi nǎichá a!', 'Ơ, {name}? Bạn cũng đến mua trà sữa à!', '是啊！你在这儿打工吗？', 'Shì a! Nǐ zài zhèr dǎgōng ma?', 'Ừ! Bạn làm thêm ở đây à?'),
      T('对，我每个周末都在这儿工作。', 'Duì, wǒ měi ge zhōumò dōu zài zhèr gōngzuò.', 'Đúng, cuối tuần nào mình cũng làm ở đây.', '工作累不累？', 'Gōngzuò lèi bu lèi?', 'Làm có mệt không?'),
      T('有点儿累，但是很有意思。', 'Yǒudiǎnr lèi, dànshì hěn yǒu yìsi.', 'Hơi mệt, nhưng rất thú vị.', '你真厉害！', 'Nǐ zhēn lìhai!', 'Bạn giỏi thật!'),
      T('你周末做什么？', 'Nǐ zhōumò zuò shénme?', 'Cuối tuần bạn làm gì?', '我在家复习汉语。', 'Wǒ zài jiā fùxí Hànyǔ.', 'Mình ở nhà ôn tiếng Trung.'),
      T('下次我们一起去公园吧！', 'Xià cì wǒmen yìqǐ qù gōngyuán ba!', 'Lần sau chúng mình cùng đi công viên nhé!', '好主意！', 'Hǎo zhǔyi!', 'Ý hay đó!')
    ] }
  ] });

  // câu đáp tiếng Trung: nghĩa (G.OK_VI, như câu tiếng Anh) và pinyin (G.ZH_OKPY) để hiện dưới lựa chọn, thẻ nói, bong bóng của người học
  G.OK_VI = G.OK_VI || {}; G.ZH_OKPY = G.ZH_OKPY || {};
  for (var id in G.LIFE) if (G.LIFE.hasOwnProperty(id) && G.LIFE[id].lang === 'zh')
    G.LIFE[id].talks.forEach(function (t) { t.turns.forEach(function (u) { G.OK_VI[u.ok] = u.okVi; G.ZH_OKPY[u.ok] = u.okPy; }); });
})();
