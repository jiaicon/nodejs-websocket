const fs = require('fs');
// 一些配置信息
const cfg = {
  port: 3000,
  ssl_key: 'ca.key',
  ssl_cert: 'ca.crt'
};

const http = require('https');
const WebSocketServer = require('ws').Server; // 引用Server类

// 创建request请求监听器
const processRequest = (req, res) => {
  res.writeHead(200);
  res.end('厉害了，我的WebSockets!\n');
};

const httpServer = http.createServer({
  // 向server传递key和cert参数
  key: fs.readFileSync(cfg.ssl_key),
  cert: fs.readFileSync(cfg.ssl_cert),
}, processRequest).listen(cfg.port);

// 实例化WebSocket服务器
const wss = new WebSocketServer({
  server: httpServer,
});


const BIND_ENTER_TYPE = 0;
const BIND_SEND_TYPE = 1;
const BIND_LEAVE_TYPE = 2;

const BIND_ROOM_ARRAY_TYPE = 3;
// 用户的房间ID
const BIND_ROOM_ID_TYPE = 4;
// 发送数据
const BIND_SEND_MESSAGE_TYPE = 5;

// 总房间数
const rooms = [];
// 用户数组
const users = [];
// 如果有WebSocket请求接入，wss对象可以响应connection事件来处理
wss.on('connection', connected => {
  console.log('服务器已启动，监听中~');
  console.log('新建连接成功');
  // 连接成功，下发房间数组
  connected.send(JSON.stringify({
    type: BIND_ROOM_ARRAY_TYPE,
    rooms: rooms,
    timestamp: Date().toLocaleLowerCase(),
  }));
  console.log(connected)
  connected.on('message', data=>{
    console.log('接收到数据', data);
    data = JSON.parse(data);
    if(data.type == BIND_ROOM_ARRAY_TYPE) {
      rooms.push(rooms.length);
      broadcastAll(wss, {
        type: BIND_ROOM_ARRAY_TYPE,
        rooms: rooms,
        timestamp: Date().toLocaleLowerCase(),
      })
    } else if(data.type == BIND_ROOM_ID_TYPE) {
      connected.roomId = data.data.id;
      const nickname = `用户${users.length}`;
      users.push(nickname)
      connected.nickname = nickname;
      broadcastEntry(wss, {
        type: BIND_ROOM_ID_TYPE,
        id: data.data.id,
        roomId: data.data.id,
        nickname: connected.nickname,
        entry: 1,
        timestamp: Date().toLocaleLowerCase(),
      });
    } else if(data.type == BIND_SEND_MESSAGE_TYPE) {
      // 接收到消息后，
      // 发送给该房间的所有人
      data.roomId = connected.roomId;
      data.nickname = connected.nickname;
      broadcast(wss, data);
    }
  })

  connected.on('close', (msg)=>{
    console.log("连接关闭", msg);
    // 广播退出
    broadcastEntry(wss, {
      type: BIND_ROOM_ID_TYPE,
      roomId: connected.roomId,
      nickname: connected.nickname,
      entry: 0,
      timestamp: Date().toLocaleLowerCase(),
    });
  })
  connected.on('error', () => {
    console.log("处理错误连接");
  })
});

function broadcast(wss, msg) {
  wss.clients.forEach(coon => {
    if(coon.roomId == msg.roomId) {
      console.log('roomId一样，发送数据');
      let own = 0;
      if(coon.nickname == msg.nickname) own = 1;
      coon.send(JSON.stringify({
        type: BIND_SEND_MESSAGE_TYPE,
        data: msg.data,
        nickname: msg.nickname,
        own: own,
        timestamp: Date().toLocaleLowerCase(),
      }))
    }
  })
}

// 进入房间时广播
function broadcastEntry(wss, msg) {
  wss.clients.forEach(coon => {
    if(coon.roomId == msg.roomId) {
      console.log('roomId一样，发送数据');
      coon.send(JSON.stringify(msg))
    }
  })
}

function broadcastAll(wss, msg) {
  wss.clients.forEach(coon => {
    coon.send(JSON.stringify(msg))
  })
}

