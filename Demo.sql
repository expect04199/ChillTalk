-- MySQL dump 10.13  Distrib 8.0.28, for Win64 (x86_64)
--
-- Host: stylishshop.cqrmkf07klla.ap-northeast-2.rds.amazonaws.com    Database: chilltalk
-- ------------------------------------------------------
-- Server version	8.0.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
-- SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
-- SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

-- SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `channels`
--

DROP TABLE IF EXISTS `channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channels` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(10) NOT NULL COMMENT 'text or voice',
  `name` varchar(255) NOT NULL,
  `room_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channels`
--

LOCK TABLES `channels` WRITE;
/*!40000 ALTER TABLE `channels` DISABLE KEYS */;
INSERT INTO `channels` VALUES (1,'text','1/2',1),(2,'text','1/3',2),(3,'text','1/4',3),(4,'text','1/5',4),(5,'text','1/6',5),(6,'text','1/7',6),(7,'text','1/8',7),(8,'text','1/9',8),(9,'text','1/11',9),(10,'text','FLY OUT',10),(11,'text','I want it that way',11),(12,'text','19/17',12),(13,'text','20/17',13),(14,'text','20/19',14),(15,'text','21/17',15),(16,'text','21/19',16),(17,'text','21/20',17),(18,'text','22/17',18),(19,'text','22/19',19),(20,'text','22/21',20),(21,'text','20/22',21),(22,'text','1/19',22),(23,'text','1/20',23),(24,'text','1/21',24),(25,'text','1/22',25),(26,'text','1/17',26),(27,'voice','視訊',11);
/*!40000 ALTER TABLE `channels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `friend_id` int NOT NULL,
  `status` varchar(255) NOT NULL COMMENT 'OK, waiting, block',
  `room_id` int DEFAULT NULL,
  `channel_id` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
INSERT INTO `friends` VALUES (1,2,1,'OK',1,'1'),(2,1,2,'OK',1,'1'),(3,3,1,'OK',2,'2'),(4,1,3,'OK',2,'2'),(5,4,1,'OK',3,'3'),(6,1,4,'OK',3,'3'),(7,5,1,'OK',4,'4'),(8,1,5,'OK',4,'4'),(9,6,1,'OK',5,'5'),(10,1,6,'OK',5,'5'),(11,7,1,'OK',6,'6'),(12,1,7,'OK',6,'6'),(13,8,1,'OK',7,'7'),(14,1,8,'OK',7,'7'),(15,9,1,'OK',8,'8'),(16,1,9,'OK',8,'8'),(17,10,1,'sending',NULL,NULL),(18,1,10,'receiving',NULL,NULL),(25,12,1,'sending',NULL,NULL),(26,1,12,'receiving',NULL,NULL),(27,13,1,'sending',NULL,NULL),(28,1,13,'receiving',NULL,NULL),(29,14,1,'sending',NULL,NULL),(30,1,14,'receiving',NULL,NULL),(31,16,1,'sending',NULL,NULL),(32,1,16,'receiving',NULL,NULL),(33,17,19,'OK',12,'12'),(34,19,17,'OK',12,'12'),(35,17,20,'OK',13,'13'),(36,20,17,'OK',13,'13'),(37,17,21,'OK',15,'15'),(38,21,17,'OK',15,'15'),(39,17,22,'OK',18,'18'),(40,22,17,'OK',18,'18'),(41,19,20,'OK',14,'14'),(42,20,19,'OK',14,'14'),(43,19,21,'OK',16,'16'),(44,21,19,'OK',16,'16'),(45,19,22,'OK',19,'19'),(46,22,19,'OK',19,'19'),(47,20,21,'OK',17,'17'),(48,21,20,'OK',17,'17'),(49,21,22,'OK',20,'20'),(50,22,21,'OK',20,'20'),(51,22,20,'OK',21,'21'),(52,20,22,'OK',21,'21'),(53,20,1,'OK',23,'23'),(54,1,20,'OK',23,'23'),(55,21,1,'OK',24,'24'),(56,1,21,'OK',24,'24'),(57,22,1,'OK',25,'25'),(58,1,22,'OK',25,'25'),(59,17,1,'OK',26,'26'),(60,1,17,'OK',26,'26'),(61,19,1,'OK',22,'22'),(62,1,19,'OK',22,'22');
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentions`
--

DROP TABLE IF EXISTS `mentions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` varchar(255) NOT NULL COMMENT 'member or host',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentions`
--

LOCK TABLES `mentions` WRITE;
/*!40000 ALTER TABLE `mentions` DISABLE KEYS */;
/*!40000 ALTER TABLE `mentions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_contents`
--

DROP TABLE IF EXISTS `message_contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_contents` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL,
  `type` varchar(255) NOT NULL COMMENT 'text or picture or voice',
  `description` varchar(255) NOT NULL COMMENT 'text content or url',
  `time` bigint NOT NULL COMMENT 'latest update time',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=228 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_contents`
--

LOCK TABLES `message_contents` WRITE;
/*!40000 ALTER TABLE `message_contents` DISABLE KEYS */;
INSERT INTO `message_contents` VALUES (13,13,'text','塞納河畔 左岸的咖啡',1657444582576),(14,14,'text','我手一杯 品嚐你的美',1657444586487),(15,15,'text','留下唇印的嘴',1657444590726),(16,16,'text','花店玫瑰 名字寫錯誰',1657444598825),(17,17,'text','告白氣球 風吹到對街',1657444604670),(18,18,'text','微笑在天上飛',1657444698556),(19,19,'text','你說你有點難追 想讓我知難而退',1657444704143),(20,20,'text','禮物不需挑最貴 只要香榭的落葉',1657444708624),(21,21,'text','營造浪漫的約會 不害怕搞砸一切',1657444713002),(22,22,'text','擁有你就擁有 全世界',1657444717341),(23,23,'text','你說藍色是你最愛的顏色',1657444925235),(24,24,'text','你說如果沒有愛那又如何',1657444944274),(25,25,'text','怎麼了 你怎麼了',1657444948850),(26,26,'text','看過你曾經最燦爛的笑容',1657444953963),(27,27,'text','看過你緊緊擁抱愛的面孔',1657444958055),(28,28,'text','怎麼了 你消失了',1657444963026),(29,29,'text','是不是我錯了  搞錯了',1657444967997),(30,30,'text','天灰了  雨下著  凝望著  你走了',1657444972911),(31,31,'text','都回不去了  像從前快樂',1657444977568),(32,32,'text','怎麼能輕易說要結束',1657444986075),(33,33,'text','怎麼會讓你抱著我哭',1657444989958),(34,34,'text','太努力的我們最後用力給祝福',1657444993719),(35,35,'text','怎麼看你笑著  我卻心如刀割',1657445000807),(36,36,'text','原來我們都一樣頑固',1657445015787),(37,37,'text','怎麼會誰都絕口不提要幸福',1657445019735),(38,38,'text','再也不能牽著你走未來每一步',1657445023829),(39,39,'text','我們懷念什麼  失去愛那一刻  才曉得',1657445027434),(40,40,'text','感受停在我發端的指尖',1657445287296),(41,41,'text','如何瞬間 凍結時間',1657445297496),(42,42,'text','記住望著我堅定的雙眼',1657445303156),(43,43,'text','也許已經 沒有明天',1657445309415),(44,44,'text','面對浩瀚的星海',1657445314735),(45,45,'text','我們微小得像塵埃',1657445322949),(46,46,'text','漂浮在 一片無奈',1657445328553),(47,47,'text','緣份讓我們相遇亂世以外',1657445333985),(48,48,'text','命運卻要我們危難中相愛',1657445341546),(49,49,'text','也許未來遙遠在光年之外',1657445348048),(50,50,'text','我願守候未知裡為你等待',1657445355621),(51,51,'text','我沒想到 為了你 我能瘋狂到',1657445360426),(52,52,'text','山崩海嘯 沒有你 根本不想逃',1657445372903),(53,53,'text','我的大腦 為了你 已經瘋狂到',1657445377702),(54,54,'text','脈搏心跳 沒有你 根本不重要',1657445382999),(55,55,'text','我的世界',1657446092014),(56,56,'text','變得奇妙更難以言喻',1657446092538),(57,57,'text','還以為',1657446104109),(58,58,'text','是從天而降的夢境',1657446104577),(59,59,'text','直到確定',1657446115179),(60,60,'text','手的溫度來自你心裡',1657446115671),(61,61,'text','這一刻',1657446132734),(62,62,'text','我終於勇敢說愛你',1657446133171),(63,63,'text','一開始',1657446163592),(64,64,'text','我只顧著看你',1657446164077),(65,65,'text','裝做不經意',1657446175388),(66,66,'text','心卻飄過去',1657446175748),(67,67,'text','還竊喜 你 沒 發現我 躲在角落',1657446180432),(68,68,'text','忙著快樂 忙著感動',1657446209378),(69,69,'text','從彼此陌生到熟 會是我們從沒想過',1657446215201),(70,70,'text','真愛 到現在 不敢期待',1657446219415),(71,71,'text','要證明自己 曾被你想起 Really？',1657446240980),(72,72,'text','我胡思亂想 就從今天起 I wish',1657446245235),(73,73,'text','像一個陷阱 卻從未猶豫 相信',1657446256718),(74,74,'text','你真的願意 就請給我驚喜',1657446257146),(75,75,'text','關於愛情 過去沒有異想的結局',1657446263647),(76,76,'text','那天起 卻顛覆了自己邏輯',1657446268047),(77,77,'text','我的懷疑 所有答案因你而明白',1657446272518),(78,78,'text','轉啊轉 就真的遇見 Mr.right',1657446277269),(79,79,'text','每天都想可以快點見到她拉她的手',1657446863270),(80,80,'text','知道她也是猜是她的未接來電來了好幾通',1657446869294),(81,81,'text','正當我想著baby 希望她馬上就來',1657446873511),(82,82,'text','意外發現她的手機沒帶',1657446878031),(83,83,'text','太意外',1657446882009),(84,84,'text','總以為她會永遠陪我一步一步慢慢走',1657446889570),(85,85,'text','總以為無聊當有趣的幽默只有她能懂',1657446895145),(86,86,'text','我不是她的菜 早該把手鬆開',1657446900747),(87,87,'text','噢 太意外',1657446904761),(88,88,'text','唉 為何妳的秘密不刪',1657446909173),(89,89,'text','唉 現在已經麻痺無感',1657446915354),(90,90,'text','到底是怎樣 別問很可怕',1657446920302),(91,91,'text','Oh girl太意外',1657446926545),(92,92,'text','唉 為何妳的幽默跟浪漫',1657446933893),(93,93,'text','要跟我以外的人分享',1657446937850),(94,94,'text','到底是怎樣 別問很可怕',1657446942918),(95,95,'text','Oh girl',1657446947293),(96,96,'text','在日出之前 能不能再看一眼 你的臉',1657447406281),(97,97,'text','在離開以前 能不能再說一些 真心的諾言',1657447410371),(98,98,'text','能不能給我 更多的時間 就躺在你的身邊',1657447415561),(99,99,'text','把這畫面 你靜靜的臉 溫柔的肩 記在心裡面',1657447420461),(100,100,'text','還是會',1657447424817),(101,101,'text','害怕 醒來不在你身邊的時候',1657447429916),(102,102,'text','害怕 從此不在你左右',1657447433962),(103,103,'text','或許我',1657447438336),(104,104,'text','還是會 還是會 還是會不知所措',1657447444330),(105,105,'text','從今以後沒有我 你會不會',1657447449794),(106,106,'text','太寂寞',1657447453961),(107,107,'text','似少年般青澀在繁華世界遊蕩',1657447588339),(108,108,'text','時間不曾改變他的模樣',1657447592266),(109,109,'text','似溪水般清澈蕩漾',1657447596985),(110,110,'text','永恆的無常中流浪',1657447601192),(111,111,'text','在鑽石面前',1657447606461),(112,112,'text','誰不會心神蕩漾',1657447611272),(113,113,'text','似佳釀般惆悵瞬間永恆中搖晃',1657447615398),(114,114,'text','夢開始的地方光芒萬丈',1657447619606),(115,115,'text','逃得過月色微涼',1657447623143),(116,116,'text','逃不過星光點絳',1657447626810),(117,117,'text','願你心中所想乘風破浪',1657447634985),(118,118,'text','似火光般燦爛激昂',1657447640663),(119,119,'text','在碰撞中想像',1657447646056),(120,120,'text','在愛情面前',1657447651880),(121,121,'text','誰不是小鹿亂撞',1657447656405),(122,122,'text','經得起白露為霜',1657447662449),(123,123,'text','受得住烈日灼傷',1657447673890),(124,124,'text','將微醺時光',1657447679163),(125,125,'text','與愛的人分享',1657447682819),(126,126,'text','我問為什麼',1657448135204),(127,127,'text','　那女孩傳簡訊給我',1657448135621),(128,127,'text','那女孩傳簡訊給我',1657448145494),(129,128,'text','而你為什麼',1657448154504),(130,129,'text','不解釋',1657448158523),(131,130,'text','低著頭沉默',1657448162929),(132,131,'text','我該相信你很愛我',1657448167499),(133,132,'text','不願意敷衍我',1657448171569),(134,133,'text','還是明白你已不想挽回什麼',1657448176662),(135,134,'text','想問為什麼　我不再是你的快樂',1657448182223),(136,135,'text','可是為什麼　卻苦笑說我都懂了',1657448188511),(137,136,'text','自尊常常將人拖著　把愛都走曲折',1657448192948),(138,137,'text','假裝了解是怕　真相太赤裸裸',1657448197692),(139,138,'text','狼狽比失去難受',1657448204122),(140,139,'text','我懷念的是無話不說　我懷念的是一起做夢',1657448210532),(141,140,'text','我懷念的是爭吵以後　還是想要愛你的衝動',1657448215977),(142,141,'text','我記得那年生日　也記得那一首歌',1657448221944),(143,142,'text','記得那片星空　最緊的右手　最暖的胸口',1657448227333),(144,143,'text','這樣太危險 飛太遠',1657458184765),(145,144,'text','對你做鬼臉 我們飛太遠',1657458192619),(146,145,'text','衝上雲端 天空沒有極限',1657458196998),(147,146,'text','他們知道我們來自哪裡',1657458209689),(148,147,'text','已經鐵了心 不掉頭回去',1657458214145),(149,148,'text','離開地表 展開雙翼飛行',1657458219128),(150,149,'text','WE GRINDING 黃金級的 SKY TEAM',1657458223536),(151,150,'text','到處都是小清新 小確幸 你要小心',1657458244844),(152,151,'text','街頭的兄弟很餓 殺出程咬金',1657458250046),(153,152,'text','現在多了我們兄弟本色',1657458255815),(154,153,'text','五個小小兵 五個忍者 天時地利人和',1657458261522),(155,154,'text','就是不矯情 就是不鳥你 做自己',1657458266324),(156,155,'text','路遙知馬力 我們的觸角早就不知伸到哪去',1657458274772),(157,156,'text','呸到全世界 飛航模式',1657458280575),(158,157,'text','沒日夜非常忙到沒時間',1657458285690),(159,158,'text','背上饒舌歌手的夢',1657458293753),(160,159,'text','我現在全實現 從玩票變全職業',1657458294487),(161,160,'text','我們先馳得點 兄弟們請你再堅持著點',1657458300009),(162,161,'text','已經混了十年 現在準備幹票大的',1657458306979),(163,162,'text','什麼都沒在怕的 HOLLA',1657461065904),(164,163,'text','我睡都還沒睡醒 準備來趕飛零機',1657461139954),(165,164,'text','飛往下個城市 躲不掉眾家媒體攝影機',1657461144764),(166,165,'text','王者起程往高峰 黃金海等我掏空',1657461149415),(167,166,'text','馬子為我暴動 富少崇拜著誓死效忠',1657461154720),(168,167,'text','不曾尖叫的開了口 抱著女友的鬆了手',1657461158969),(169,168,'text','全場歡聲像獅子吼安可不夠多觀眾攏美送',1657461163476),(170,169,'text','HUSTLING EVERYDAY I HUSTLING',1657461167737),(171,170,'text','GOYARD GUCCI VERSACE',1657461172221),(172,171,'text','我就像是奢侈品 締造歷史傳奇',1657461178215),(173,172,'text','遍地踏下足跡 直奔華語界的甲子園',1657461183353),(174,173,'text','與我兄弟 BACK TO BACK',1657461188744),(175,174,'text','HOME RUN 砲火 BACK TO BACK',1657461193469),(176,175,'text','最高層級地平線 感官炸裂新體驗',1657461197972),(177,176,'text','小子心裡面想成為我翻版 肖想我的GOLD CHAIN',1657461202241),(178,177,'text','You are my fire',1657504319148),(179,178,'text','The one desire',1657504325585),(180,179,'text','Believe when I say',1657504330443),(181,180,'text','I want it that way',1657504334924),(182,181,'text','But we are two worlds apart',1657504341355),(183,182,'text','Can\'t reach to your heart',1657504346281),(184,183,'text','When you say',1657504353477),(185,184,'text','That I want it that way',1657504360544),(187,186,'text','Tell me why',1657504378907),(188,187,'text','Ain\'t nothin\' but a heartache',1657504389219),(190,189,'text','Tell me why',1657504401608),(191,190,'text','Ain\'t nothin\' but a mistake',1657504408290),(192,191,'text','Tell me why',1657504427929),(193,192,'text','I never wanna hear you say',1657504560880),(194,193,'text','這樣太危險 飛太遠',1657508839618),(195,194,'text','對你做鬼臉 我們飛太遠',1657508840222),(196,195,'text','衝上雲端 天空沒有極限',1657508843995),(197,196,'text','他們知道我們來自哪裡',1657510324853),(198,197,'text','已經鐵了心 不掉頭回去',1657510328649),(199,198,'text','離開地表 展開雙翼飛行',1657510333329),(200,199,'text','WE GRINDING 黃金級的 SKY TEAM',1657510337739),(201,200,'text','收拾好我的行李 等等我就要飛行',1657510380953),(203,202,'text','家人放在心裡 兄弟讓我來挺你',1657510422907),(204,203,'text','以小博大的刺激 賺到大把的資金',1657510434242),(205,204,'text','不講資歷 講實力 繼續PUNCH我的詞句',1657510439295),(206,205,'text','下飛機我眼睛睜開',1657510444099),(207,206,'text','我知道所有人都站在舞台下等待',1657510449653),(208,207,'text','就是有這本領HOLD 住著全場的能耐',1657510454006),(209,208,'text','背負著所有老鄉心中的期待',1657510458994),(210,209,'text','就快踏遍全世界 高樓矮房放進我視線',1657510481493),(211,210,'text','每場演出對我來說都是場試煉',1657510494758),(212,211,'text','ㄧ直RACKS ON RACKS我事業',1657510499471),(213,211,'text','一直RACKS ON RACKS我事業',1657510509544),(214,212,'text','誰是你最愛的老鄉不用自薦',1657510517228),(215,213,'text','多自戀到世界各地看他熱度有多熾燄',1657510521325),(216,214,'text','大把鈔票劃在刀口上 這些歌詞燒口燙',1657510564529),(217,215,'text','每一個字都是黃金場子留給高手唱',1657510569873),(218,216,'text','飛了這麼遠還不打算要歇腳',1657510574697),(219,217,'text','我花了越多賺的越多 BALL LIKE JAY CHOU',1657510592868),(220,218,'text','管他誰的主場 他們當我流氓',1657510598809),(221,219,'text','我搶了他的市場 傷到自尊心想找我求償',1657510604922),(222,220,'text','我教你怎麼當個男子漢 敢擋子彈',1657510609424),(223,221,'text','誰管你喜歡還是不喜歡 都別來點我讚',1657510613594),(224,222,'text','一堆小清新 唱歌夾著小雞雞 我呸',1657510618877),(225,223,'text','一秒帶走你的馬子今晚跟我睡',1657510624679),(226,224,'text','你不是我的朋友不要跟我聊忠誠',1657510629813),(227,225,'text','我沒有風度 只有態度像是姚中仁',1657510633757);
/*!40000 ALTER TABLE `message_contents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `channel_id` int NOT NULL,
  `initial_time` bigint NOT NULL,
  `reply` int DEFAULT NULL COMMENT 'message id',
  `pinned` tinyint(1) NOT NULL DEFAULT '0',
  `is_edited` tinyint(1) NOT NULL DEFAULT '0',
  `session` int unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=226 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (13,2,1,1657444582576,NULL,0,0,1),(14,2,1,1657444586487,NULL,0,0,2),(15,2,1,1657444590726,NULL,0,0,3),(16,2,1,1657444598825,NULL,0,0,4),(17,2,1,1657444604670,NULL,0,0,5),(18,2,1,1657444698556,NULL,0,0,6),(19,2,1,1657444704143,NULL,0,0,7),(20,2,1,1657444708624,NULL,0,0,8),(21,2,1,1657444713002,NULL,0,0,9),(22,2,1,1657444717341,NULL,0,0,10),(23,3,2,1657444925235,NULL,0,0,1),(24,3,2,1657444944274,NULL,0,0,2),(25,3,2,1657444948850,NULL,0,0,3),(26,3,2,1657444953963,NULL,0,0,4),(27,3,2,1657444958055,NULL,0,0,5),(28,3,2,1657444963026,NULL,0,0,6),(29,3,2,1657444967997,NULL,0,0,7),(30,3,2,1657444972911,NULL,0,0,8),(31,3,2,1657444977568,NULL,0,0,9),(32,3,2,1657444986075,NULL,0,0,10),(33,3,2,1657444989958,NULL,0,0,11),(34,3,2,1657444993719,NULL,0,0,12),(35,3,2,1657445000807,NULL,0,0,13),(36,3,2,1657445015787,NULL,0,0,14),(37,3,2,1657445019735,NULL,0,0,15),(38,3,2,1657445023829,NULL,0,0,16),(39,3,2,1657445027434,NULL,0,0,17),(40,4,3,1657445287296,NULL,0,0,1),(41,4,3,1657445297496,NULL,0,0,2),(42,4,3,1657445303156,NULL,0,0,3),(43,4,3,1657445309415,NULL,0,0,4),(44,4,3,1657445314735,NULL,0,0,5),(45,4,3,1657445322949,NULL,0,0,6),(46,4,3,1657445328553,NULL,0,0,7),(47,4,3,1657445333985,NULL,0,0,8),(48,4,3,1657445341546,NULL,0,0,9),(49,4,3,1657445348048,NULL,0,0,10),(50,4,3,1657445355621,NULL,0,0,11),(51,4,3,1657445360426,NULL,0,0,12),(52,4,3,1657445372903,NULL,0,0,13),(53,4,3,1657445377702,NULL,0,0,14),(54,4,3,1657445382999,NULL,0,0,15),(55,5,4,1657446092014,NULL,0,0,1),(56,5,4,1657446092538,NULL,0,0,1),(57,5,4,1657446104109,NULL,0,0,2),(58,5,4,1657446104577,NULL,0,0,2),(59,5,4,1657446115179,NULL,0,0,3),(60,5,4,1657446115671,NULL,0,0,3),(61,5,4,1657446132734,NULL,0,0,4),(62,5,4,1657446133171,NULL,0,0,4),(63,5,4,1657446163592,NULL,0,0,5),(64,5,4,1657446164077,NULL,0,0,5),(65,5,4,1657446175388,NULL,0,0,6),(66,5,4,1657446175748,NULL,0,0,6),(67,5,4,1657446180432,NULL,0,0,7),(68,5,4,1657446209378,NULL,0,0,8),(69,5,4,1657446215201,NULL,0,0,9),(70,5,4,1657446219415,NULL,0,0,10),(71,5,4,1657446240980,NULL,0,0,11),(72,5,4,1657446245235,NULL,0,0,12),(73,5,4,1657446256718,NULL,0,0,13),(74,5,4,1657446257146,NULL,0,0,13),(75,5,4,1657446263647,NULL,0,0,14),(76,5,4,1657446268047,NULL,0,0,15),(77,5,4,1657446272518,NULL,0,0,16),(78,5,4,1657446277269,NULL,0,0,17),(79,6,5,1657446863270,NULL,0,0,1),(80,6,5,1657446869294,NULL,0,0,2),(81,6,5,1657446873511,NULL,0,0,3),(82,6,5,1657446878031,NULL,0,0,4),(83,6,5,1657446882009,NULL,0,0,5),(84,6,5,1657446889570,NULL,0,0,6),(85,6,5,1657446895145,NULL,0,0,7),(86,6,5,1657446900747,NULL,0,0,8),(87,6,5,1657446904761,NULL,0,0,9),(88,6,5,1657446909173,NULL,0,0,10),(89,6,5,1657446915354,NULL,0,0,11),(90,6,5,1657446920302,NULL,0,0,12),(91,6,5,1657446926545,NULL,0,0,13),(92,6,5,1657446933893,NULL,0,0,14),(93,6,5,1657446937850,NULL,0,0,15),(94,6,5,1657446942918,NULL,0,0,16),(95,6,5,1657446947293,NULL,0,0,17),(96,7,6,1657447406281,NULL,0,0,1),(97,7,6,1657447410371,NULL,0,0,2),(98,7,6,1657447415561,NULL,0,0,3),(99,7,6,1657447420461,NULL,0,0,4),(100,7,6,1657447424817,NULL,0,0,5),(101,7,6,1657447429916,NULL,0,0,6),(102,7,6,1657447433962,NULL,0,0,7),(103,7,6,1657447438336,NULL,0,0,8),(104,7,6,1657447444330,NULL,0,0,9),(105,7,6,1657447449794,NULL,0,0,10),(106,7,6,1657447453961,NULL,0,0,11),(107,8,7,1657447588339,NULL,0,0,1),(108,8,7,1657447592266,NULL,0,0,2),(109,8,7,1657447596985,NULL,0,0,3),(110,8,7,1657447601192,NULL,0,0,4),(111,8,7,1657447606461,NULL,0,0,5),(112,8,7,1657447611272,NULL,0,0,6),(113,8,7,1657447615398,NULL,0,0,7),(114,8,7,1657447619606,NULL,0,0,8),(115,8,7,1657447623143,NULL,0,0,9),(116,8,7,1657447626810,NULL,0,0,10),(117,8,7,1657447634985,NULL,0,0,11),(118,8,7,1657447640663,NULL,0,0,12),(119,8,7,1657447646056,NULL,0,0,13),(120,8,7,1657447651880,NULL,0,0,14),(121,8,7,1657447656405,NULL,0,0,15),(122,8,7,1657447662449,NULL,0,0,16),(123,8,7,1657447673890,NULL,0,0,17),(124,8,7,1657447679163,NULL,0,0,18),(125,8,7,1657447682819,NULL,0,0,19),(126,9,8,1657448135204,NULL,0,0,1),(127,9,8,1657448135621,NULL,0,1,1),(128,9,8,1657448154504,NULL,0,0,2),(129,9,8,1657448158523,NULL,0,0,3),(130,9,8,1657448162929,NULL,0,0,4),(131,9,8,1657448167499,NULL,0,0,5),(132,9,8,1657448171569,NULL,0,0,6),(133,9,8,1657448176662,NULL,0,0,7),(134,9,8,1657448182223,NULL,0,0,8),(135,9,8,1657448188511,NULL,0,0,9),(136,9,8,1657448192948,NULL,0,0,10),(137,9,8,1657448197692,NULL,0,0,11),(138,9,8,1657448204122,NULL,0,0,12),(139,9,8,1657448210532,NULL,0,0,13),(140,9,8,1657448215977,NULL,0,0,14),(141,9,8,1657448221944,NULL,0,0,15),(142,9,8,1657448227333,NULL,0,0,16),(143,22,10,1657458184765,NULL,0,0,1),(144,22,10,1657458192619,NULL,0,0,2),(145,22,10,1657458196998,NULL,0,0,3),(146,22,10,1657458209689,NULL,0,0,4),(147,22,10,1657458214145,NULL,0,0,5),(148,22,10,1657458219128,NULL,0,0,6),(149,22,10,1657458223536,NULL,0,0,7),(150,21,10,1657458244844,NULL,0,0,8),(151,21,10,1657458250046,NULL,0,0,9),(152,21,10,1657458255815,NULL,0,0,10),(153,21,10,1657458261522,NULL,0,0,11),(154,21,10,1657458266324,NULL,0,0,12),(155,21,10,1657458274772,NULL,0,0,13),(156,21,10,1657458280575,NULL,0,0,14),(157,21,10,1657458285690,NULL,0,0,15),(158,21,10,1657458293753,NULL,0,0,16),(159,21,10,1657458294487,NULL,0,0,16),(160,21,10,1657458300009,NULL,0,0,17),(161,21,10,1657458306979,NULL,0,0,18),(162,21,10,1657461065904,NULL,0,0,19),(163,20,10,1657461139954,NULL,0,0,20),(164,20,10,1657461144764,NULL,0,0,21),(165,20,10,1657461149415,NULL,0,0,22),(166,20,10,1657461154720,NULL,0,0,23),(167,20,10,1657461158969,NULL,0,0,24),(168,20,10,1657461163476,NULL,0,0,25),(169,20,10,1657461167737,NULL,0,0,26),(170,20,10,1657461172221,NULL,0,0,27),(171,20,10,1657461178215,NULL,0,0,28),(172,20,10,1657461183353,NULL,0,0,29),(173,20,10,1657461188744,NULL,0,0,30),(174,20,10,1657461193469,NULL,0,0,31),(175,20,10,1657461197972,NULL,0,0,32),(176,20,10,1657461202241,NULL,0,0,33),(177,24,11,1657504319148,NULL,0,0,1),(178,24,11,1657504325585,NULL,0,0,2),(179,24,11,1657504330443,NULL,0,0,3),(180,24,11,1657504334924,NULL,0,0,4),(181,24,11,1657504341355,NULL,0,0,5),(182,24,11,1657504346281,NULL,0,0,6),(183,24,11,1657504353477,NULL,0,0,7),(184,24,11,1657504360544,NULL,0,0,8),(186,1,11,1657504378907,NULL,0,0,9),(187,1,11,1657504389219,NULL,0,0,10),(189,24,11,1657504401608,NULL,0,0,11),(190,24,11,1657504408290,NULL,0,0,12),(191,1,11,1657504427929,NULL,0,0,13),(192,24,11,1657504560880,NULL,0,0,14),(193,22,10,1657508839618,NULL,0,0,34),(194,22,10,1657508840222,NULL,0,0,34),(195,22,10,1657508843995,NULL,0,0,35),(196,17,10,1657510324853,NULL,0,0,36),(197,17,10,1657510328649,NULL,0,0,37),(198,17,10,1657510333329,NULL,0,0,38),(199,17,10,1657510337739,NULL,0,0,39),(200,19,10,1657510380953,NULL,0,0,40),(202,19,10,1657510422907,NULL,0,0,41),(203,19,10,1657510434242,NULL,0,0,42),(204,19,10,1657510439295,NULL,0,0,43),(205,19,10,1657510444099,NULL,0,0,44),(206,19,10,1657510449653,NULL,0,0,45),(207,19,10,1657510454006,NULL,0,0,46),(208,19,10,1657510458994,NULL,0,0,47),(209,19,10,1657510481493,NULL,0,0,48),(210,19,10,1657510494758,NULL,0,0,49),(211,19,10,1657510499471,NULL,0,1,50),(212,19,10,1657510517228,NULL,0,0,51),(213,19,10,1657510521325,NULL,0,0,52),(214,17,10,1657510564529,NULL,0,0,53),(215,17,10,1657510569873,NULL,0,0,54),(216,17,10,1657510574697,NULL,0,0,55),(217,17,10,1657510592868,NULL,0,0,56),(218,17,10,1657510598809,NULL,0,0,57),(219,17,10,1657510604922,NULL,0,0,58),(220,17,10,1657510609424,NULL,0,0,59),(221,17,10,1657510613594,NULL,0,0,60),(222,17,10,1657510618877,NULL,0,0,61),(223,17,10,1657510624679,NULL,0,0,62),(224,17,10,1657510629813,NULL,0,0,63),(225,17,10,1657510633757,NULL,0,0,64);
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pictures`
--

DROP TABLE IF EXISTS `pictures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pictures` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `source` varchar(255) NOT NULL COMMENT 'room or user',
  `source_id` int NOT NULL,
  `type` varchar(30) NOT NULL COMMENT 'compress or original',
  `image` varchar(255) NOT NULL,
  `storage_type` varchar(45) NOT NULL,
  `preset` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pictures`
--

LOCK TABLES `pictures` WRITE;
/*!40000 ALTER TABLE `pictures` DISABLE KEYS */;
INSERT INTO `pictures` VALUES (1,'user',1,'picture','1657449479361','original',0),(2,'user',1,'background','sunset.jpg','original',1),(3,'user',2,'picture','1657444435280','original',0),(4,'user',2,'background','sunset.jpg','original',1),(5,'room',1,'picture','dogee.png','original',1),(6,'user',3,'picture','1657444905814','original',0),(7,'user',3,'background','sunset.jpg','original',1),(8,'room',2,'picture','dogee.png','original',1),(9,'user',4,'picture','1657445249957','original',0),(10,'user',4,'background','sunset.jpg','original',1),(11,'room',3,'picture','dogee.png','original',1),(12,'user',5,'picture','1657445860952','original',0),(13,'user',5,'background','sunset.jpg','original',1),(14,'room',4,'picture','dogee.png','original',1),(15,'user',6,'picture','1657446760467','original',0),(16,'user',6,'background','sunset.jpg','original',1),(17,'room',5,'picture','dogee.png','original',1),(18,'user',7,'picture','1657447152623','original',0),(19,'user',7,'background','sunset.jpg','original',1),(20,'room',6,'picture','dogee.png','original',1),(21,'user',8,'picture','1657447536572','original',0),(22,'user',8,'background','sunset.jpg','original',1),(23,'room',7,'picture','dogee.png','original',1),(24,'user',9,'picture','1657448060679','original',0),(25,'user',9,'background','sunset.jpg','original',1),(26,'room',8,'picture','dogee.png','original',1),(27,'user',10,'picture','1657448551704','original',0),(28,'user',10,'background','sunset.jpg','original',1),(32,'user',12,'picture','1657449111590','original',0),(33,'user',12,'background','sunset.jpg','original',1),(34,'user',13,'picture','1657455219626','original',0),(35,'user',13,'background','sunset.jpg','original',1),(36,'user',14,'picture','1657455528152','original',0),(37,'user',14,'background','sunset.jpg','original',1),(38,'user',16,'picture','1657455684110','original',0),(39,'user',16,'background','sunset.jpg','original',1),(40,'user',17,'picture','1657457173524','original',0),(41,'user',17,'background','sunset.jpg','original',1),(42,'room',10,'picture','1657457327881','original',0),(43,'user',19,'picture','1657457638538','original',0),(44,'user',19,'background','sunset.jpg','original',1),(45,'user',20,'picture','1657457698414','original',0),(46,'user',20,'background','sunset.jpg','original',1),(47,'user',21,'picture','1657457833384','original',0),(48,'user',21,'background','sunset.jpg','original',1),(49,'user',22,'picture','1657458028400','original',0),(50,'user',22,'background','sunset.jpg','original',1),(51,'user',24,'picture','1657502593985','original',0),(52,'user',24,'background','sunset.jpg','original',1),(53,'room',11,'picture','1657502764870','original',0),(54,'room',12,'picture','dogee.png','original',1),(55,'room',13,'picture','dogee.png','original',1),(56,'room',14,'picture','dogee.png','original',1),(57,'room',15,'picture','dogee.png','original',1),(58,'room',16,'picture','dogee.png','original',1),(59,'room',17,'picture','dogee.png','original',1),(60,'room',18,'picture','dogee.png','original',1),(61,'room',19,'picture','dogee.png','original',1),(62,'room',20,'picture','dogee.png','original',1),(63,'room',21,'picture','dogee.png','original',1),(64,'room',22,'picture','dogee.png','original',1),(65,'room',23,'picture','dogee.png','original',1),(66,'room',24,'picture','dogee.png','original',1),(67,'room',25,'picture','dogee.png','original',1),(68,'room',26,'picture','dogee.png','original',1);
/*!40000 ALTER TABLE `pictures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_members`
--

DROP TABLE IF EXISTS `room_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_members` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_members`
--

LOCK TABLES `room_members` WRITE;
/*!40000 ALTER TABLE `room_members` DISABLE KEYS */;
INSERT INTO `room_members` VALUES (1,1,1),(2,1,2),(3,2,1),(4,2,3),(5,3,1),(6,3,4),(7,4,1),(8,4,5),(9,5,1),(10,5,6),(11,6,1),(12,6,7),(13,7,1),(14,7,8),(15,8,1),(16,8,9),(17,9,1),(18,9,11),(19,10,17),(20,10,1),(21,10,19),(22,10,20),(23,10,21),(24,10,22),(25,11,1),(26,11,24),(27,12,19),(28,12,17),(29,13,20),(30,13,17),(31,14,20),(32,14,19),(33,15,21),(34,15,17),(35,16,21),(36,16,19),(37,17,21),(38,17,20),(39,18,22),(40,18,17),(41,19,22),(42,19,19),(43,20,22),(44,20,21),(45,21,20),(46,21,22),(47,22,1),(48,22,19),(49,23,1),(50,23,20),(51,24,1),(52,24,21),(53,25,1),(54,25,22),(55,26,1),(56,26,17);
/*!40000 ALTER TABLE `room_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `host_id` int NOT NULL,
  `type` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'1/2',1,'private'),(2,'1/3',1,'private'),(3,'1/4',1,'private'),(4,'1/5',1,'private'),(5,'1/6',1,'private'),(6,'1/7',1,'private'),(7,'1/8',1,'private'),(8,'1/9',1,'private'),(10,'兄弟本色G.U.T.S',17,'public'),(11,'Backstreet boys',1,'public'),(12,'19/17',19,'private'),(13,'20/17',20,'private'),(14,'20/19',20,'private'),(15,'21/17',21,'private'),(16,'21/19',21,'private'),(17,'21/20',21,'private'),(18,'22/17',22,'private'),(19,'22/19',22,'private'),(20,'22/21',22,'private'),(21,'20/22',20,'private'),(22,'1/19',1,'private'),(23,'1/20',1,'private'),(24,'1/21',1,'private'),(25,'1/22',1,'private'),(26,'1/17',1,'private');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stream_members`
--

DROP TABLE IF EXISTS `stream_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stream_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `channel_id` int NOT NULL,
  `user_id` int NOT NULL,
  `socket_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stream_members`
--

LOCK TABLES `stream_members` WRITE;
/*!40000 ALTER TABLE `stream_members` DISABLE KEYS */;
INSERT INTO `stream_members` VALUES (2,1,1,'uJLNsaMM4Vg7ww_MAAAN');
/*!40000 ALTER TABLE `stream_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_read_status`
--

DROP TABLE IF EXISTS `user_read_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_read_status` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `room_id` int NOT NULL,
  `channel_id` int NOT NULL,
  `message_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_read_status`
--

LOCK TABLES `user_read_status` WRITE;
/*!40000 ALTER TABLE `user_read_status` DISABLE KEYS */;
INSERT INTO `user_read_status` VALUES (1,2,1,1,22),(2,1,1,1,22),(3,3,2,2,39),(4,1,2,2,39),(5,4,3,3,54),(6,1,3,3,54),(7,1,4,4,78),(8,5,4,4,78),(9,6,5,5,95),(10,1,5,5,95),(11,7,6,6,106),(12,1,6,6,106),(13,8,7,7,125),(14,1,7,7,125),(15,9,8,8,142),(16,1,8,8,142),(18,21,10,10,176),(20,22,10,10,195),(22,20,10,10,176),(23,1,10,10,225),(24,1,11,11,192),(25,24,11,11,192),(26,19,10,10,213),(27,17,10,10,225);
/*!40000 ALTER TABLE `user_read_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `introduction` varchar(255) NOT NULL,
  `online` int NOT NULL COMMENT '0 is offline, 1 is online',
  `last_login` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Harry','test123@test.com','$2a$10$s6IYPT/b/00.qfBy3u9sg.WFP5FvOvg5sQMhukP6hDDNkR78kJB5i','No content',1,1657516058542),(2,'杰倫','test1231@test.com','$2a$10$remKSm1ynYbQt1wi/x1IsOfYxUo9k0WAQYA6DsQ0U171hLDMMjMZK','No content',0,1657444331360),(3,'周興哲','test1232@test.com','$2a$10$nzEJewpv.NlJ4CQ4Xae/muBPCf63lv4UfjvaIQyTFUrekr1202mjq','No content',0,1657444785906),(4,'鄧紫棋','test1233@test.com','$2a$10$cy1N7Gi8t6DlAT1Ti8jV4O3A8.aDxKkcYaLd5yKMTsyGOvm0O87ZC','No content',0,1657445233840),(5,'蔡依林','test1234@test.com','$2a$10$JHYtGQ9NtWE.56RhXKGIuOv0lPacR84T0T7UE3hNRhVbI8f6C2r0m','No content',0,1657445645257),(6,'J.Sheon','test1235@test.com','$2a$10$4JChVN9Eu5bSP2r6nkkRuOiKieQo70FgOKHqEL3I1zuUODOcDBeyO','No content',0,1657446749819),(7,'韋禮安','test1236@test.com','$2a$10$HgLKSlENiqff3yOB0EsMMOdhInHx8SaStEX6HZew0zZiB8RcexZrS','No content',0,1657447001082),(8,'張新成','test1237@test.com','$2a$10$2VLpFoTsALNVt2LvQyE3Sup2ax9isAuy9LV7VqnmB2oeyvz7ciSzu','No content',0,1657447513412),(9,'孫燕姿','test1238@test.com','$2a$10$L7mQy5VdLghDL1yg/ht3Uu2oO3z7V1aiIp8M2OHKyl59n2y5lV0U.','No content',0,1657448049140),(10,'Tom ','test1239@test.com','$2a$10$/P8irCY49su7k0.dDDJDYeF1cVdXJBtwnkAi6kQrX3fSv8o8HQlXa','No content',0,1657448302457),(12,'Natalie','test1240@test.com','$2a$10$Qbj4dL0ZEEn6lpxuWFbhyOYEkko8BiZ6CCwHOkfK3uBr49r9qN6CG','No content',0,1657455106310),(13,'Millie','test1241@test.com','$2a$10$ihyHclLn4f4lBTjXPsy75ucNbpNnuUo77isk8nELzG1VdVJdjY0mu','No content',0,1657455209295),(14,'Anne','test1242@test.com','$2a$10$MzFxejQTyOanOr68xV9CKOsOrIetO1KRU5eBteDuG0A1RGTcJVbrq','No content',0,1657455511645),(16,'Leonardo','test1243@test.com','$2a$10$iC2NaCO5ezQi5sPdCCQ3y.i8RFZL98gSLQQFNdqeTRoDKqpwYAFKK','No content',0,1657455672075),(17,'E.SO','test1244@test.com','$2a$10$hYinN4jIhLfH.qsEqtO1lO7KhWqjF5TPdyXreWOomhPrZalThlk62','No content',0,1657510537966),(19,'Muta','test1245@test.com','$2a$10$6rsfmj5PCroRRe6EAalYjObXi6DzKytQWjrUuHRhadm8YMtp8CiK2','No content',0,1657510363847),(20,'Kenzy','test1246@test.com','$2a$10$t8jYlxS2hXkoJG8yqfGBbOW1i/D/iS0qHZV5ecB4vbsV/RUcTWVxa','No content',0,1657504874030),(21,'熱狗','test1247@test.com','$2a$10$hWPY13ddFT8NmA5RRnPQDuOeAOsTjDl705nJSangxPLByvi1gjzoG','No content',0,1657504906134),(22,'張震嶽','test1248@test.com','$2a$10$qNplzZSdCQ9Rd5Xu/FigD.KU3e.D3glnMtHV0HGa2FUXrFUdwvm4e','No content',0,1657508810022),(24,'Backstreet Boys','test1249@test.com','$2a$10$X6CuzdUouwIkcAbtrqE7T.FozA0ICOLqEVwaQh8vOW/q8TjjHUGa2','No content',1,1657511105738);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;*/
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-07-11 13:20:36
