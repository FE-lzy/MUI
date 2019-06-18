/**
 * 演示程序当前的 “注册/登录” 等操作，是基于 “本地存储” 完成的
 * 当您要参考这个演示程序进行相关 app 的开发时，
 * 请注意将相关方法调整成 “基于服务端Service” 的实现。
 **/
(function($, owner) {
	/**
	 * 用户登录
	 **/
	var db = openDatabase('testDB', '1.0', 'Test DB', 2 * 1024 * 1024);
	 
	owner.login = function(loginInfo, callback) {
		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.account = loginInfo.account || '';
		loginInfo.password = loginInfo.password || '';
		if (loginInfo.account.length < 0) {
			return callback('账号不为空');
		}
		if (loginInfo.password.length < 0) {
			return callback('密码不为空');
		}
		var authed = false;
		db.transaction(function (context) {
		   context.executeSql('SELECT * FROM users where account = ? and password = ?', [loginInfo.account,loginInfo.password], function (context, results) {
				console.log(results.rows.length);
				if(results.rows.length > 0){
					authed = true;
					console.log(results.rows)
				}
				if (authed) {
					return owner.createState(results.rows[0].id, callback);
					
				} else {
					return callback('用户名或密码错误');
				}
				
			});
		 });
		 
		
	};

	owner.createState = function(uid, callback) {
		var state = owner.getState();
		state.uid = uid;
		state.token = "token123456789";
		owner.setState(state);
		return callback();
	};

	/**
	 * 新用户注册
	 **/
	owner.reg = function(regInfo, callback) {
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.account = regInfo.account || '';
		regInfo.password = regInfo.password || '';
		regInfo.age = regInfo.age || '';
		var pattern = '/^[A-Za-z0-9]+$/';
		if(!(/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/).test(regInfo.account)){
			console.log(/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/.test(regInfo.account))
			return callback('用户名规定字母和数字');
		}
		if(!(/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/).test(regInfo.password)){
			console.log(/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/.test(regInfo.password))
			return callback('密码规定字母和数字');
		}
		if (regInfo.password.length < 8) {
			return callback('密码最短需要 8 个字符');
		}
		if (regInfo.age.length < 0 || regInfo.age < 0 || regInfo.age > 130 ) {
			return callback('请输入正确的年龄');
		}
		var users = JSON.parse(localStorage.getItem('$users') || '[]');
		users.push(regInfo);
		localStorage.setItem('$users', JSON.stringify(users));
		return callback();
	};
	
	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};


	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
		//var settings = owner.getSettings();
		//settings.gestures = '';
		//owner.setSettings(settings);
	};

	var checkEmail = function(email) {
		email = email || '';
		return (email.length > 3 && email.indexOf('@') > -1);
	};
	// 获取用户个人信息
	owner.getInfo = function(callback){
		var uid = owner.getState().uid;
		console.log(uid)
		db.transaction(function (context) {
		   context.executeSql('SELECT * FROM users where id = ?', [uid], function (context, results) {
				console.log(results.rows);
				if(results.rows.length > 0){
					return callback(results.rows[0]);
				} else {
					return callback(0)
				}
			});
			
		 });
	}
	
	owner.updatePersonal = function(result,callback){
		console.log(result)
		var password = result.password;
		console.log(password);
		var age = result.age;
		var sex = result.sex;
		console.log(result)
		if(password == ''){
			return callback(0,'密码不能为空');	
		} 
		if(age == ''){
			return callback(0,'年龄不能为空');
		}
		if (regInfo.password.length < 8) {
			return callback('密码最短需要 8 个字符');
		}
		if (regInfo.age.length < 0 || regInfo.age < 0 || regInfo.age > 130 ) {
			return callback('请输入正确的年龄');
		}
		var uid = owner.getState().uid;
		db.transaction(function (context) {
		   context.executeSql('update users set password = ?, sex = ? , age = ? where id = ?',[password,sex,age,uid]);
			return callback(1,'更新成功');
		});
	}

	// 获取用户初始金额
	owner.getAmount = function(callback){
		var uid = owner.getState().uid;
		console.log(uid)
		db.transaction(function (context) {
			context.executeSql('CREATE TABLE IF NOT EXISTS amount (id Integer primary key autoincrement,uid, amount)');
			 context.executeSql('SELECT * FROM amount', [], function (context, results) {
				 console.log('全部');
				 console.log(results)
			 });
		   context.executeSql('SELECT * FROM amount where uid = ?', [uid], function (context, results) {
				console.log(results.rows);
				if(results.rows.length > 0){
					return callback(results.rows[0]);
				} else {
					context.executeSql('INSERT INTO amount (uid,amount) VALUES (?,?)',[uid,0]);
					console.log('执行用户'+uid+'初始化');
				}
			});
		 });
	}
	// 修改
	owner.updateAmount = function(result,callback){
		var amount = result.amount;
		if(amount == ''){
			amount = 0;
		} 
		var uid = owner.getState().uid;
		db.transaction(function (context) {
		   context.executeSql('update amount set amount = ? where uid = ?',[amount,uid]);
	
			return callback(1,'更新成功');
		});
	}
	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if (!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};
	/**
	 * 添加账单
	 */
	owner.addJournal = function(addInfo,callback){
		callback = callback || $.noop;
		var price = addInfo.price;
		var type = addInfo.type;
		var date = addInfo.date;
		var note = addInfo.note;
		var uid =owner.getState().uid;
		db.transaction(function (context) {
		   context.executeSql('CREATE TABLE IF NOT EXISTS lists (id Integer primary key autoincrement,uid, price,type,date,note)');
		   context.executeSql('INSERT INTO lists (uid,price,type,date,note) VALUES (?,?,?,?,?)',[uid,addInfo.price,addInfo.type,addInfo.date,addInfo.note]);
		 });
		 
		 return callback();
	}
	/**
	 * 账单列表
	 */
	owner.getList = function(callback){
		callback = callback || $.noop;
		var uid =owner.getState().uid;
	
		db.transaction(function (context) {
		   context.executeSql('SELECT * FROM lists where uid = ?', [uid], function (context, results) {
				console.log(results.rows.length);
				if(results.rows.length > 0){
					return callback(results.rows)
				} 
			});
			
		 });
		 return callback(0)
		 
	}
	/**
	 * 获取列表详情
	 */
	owner.getListDetail = function(id,callback){
		callback = callback || $.noop;
		db.transaction(function (context) {
		   context.executeSql('SELECT * FROM list where id = ?', [id], function (context, results) {
				console.log(results.rows.length);
				if(results.rows.length > 0){
					return callback(results.rows);
				} 
			});
		 });
		 return callback(0)
	}
	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
			var settingsText = localStorage.getItem('$settings') || "{}";
			return JSON.parse(settingsText);
		}
		/**
		 * 获取本地是否安装客户端
		 **/
	owner.isInstalled = function(id) {
		if (id === 'qihoo' && mui.os.plus) {
			return true;
		}
		if (mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch (e) {}
		} else {
			switch (id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	}
}(mui, window.app = {}));