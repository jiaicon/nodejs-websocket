let ws = require('nodejs-websocket');

const PORT = 3000;

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

const server = ws.createServer(connected => {
  console.log('新建连接成功');
  // 连接成功，下发房间数组
  connected.send(JSON.stringify({
    type: BIND_ROOM_ARRAY_TYPE,
    rooms: rooms,
    timestamp: Date().toLocaleLowerCase(),
  }));

  connected.on('text', data=>{
    console.log('接收到数据', data);
    data = JSON.parse(data);
    if(data.type == BIND_ROOM_ARRAY_TYPE) {
      rooms.push(rooms.length);
      broadcastAll(server, {
        type: BIND_ROOM_ARRAY_TYPE,
        rooms: rooms,
        timestamp: Date().toLocaleLowerCase(),
      })
    } else if(data.type == BIND_ROOM_ID_TYPE) {
      connected.roomId = data.data.id;
      const nickname = `用户${users.length}`;
      users.push(nickname)
      connected.nickname = nickname;
      broadcastEntry(server, {
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
      broadcast(server, data);
    }
  })

  connected.on('close', (msg)=>{
    console.log("连接关闭", msg);
    // 广播退出
    broadcastEntry(server, {
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
})

function broadcast(server, msg) {
  server.connections.forEach(coon => {
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
function broadcastEntry(server, msg) {
  server.connections.forEach(coon => {
    if(coon.roomId == msg.roomId) {
      console.log('roomId一样，发送数据');
      coon.send(JSON.stringify(msg))
    }
  })
}

function broadcastAll(server, msg) {
  server.connections.forEach(coon => {
    coon.send(JSON.stringify(msg))
  })
}



server.listen(PORT, ()=>{
  console.log("服务器启动成功：http://localhost:"+PORT);
})
