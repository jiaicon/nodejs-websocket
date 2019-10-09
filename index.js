let ws = require('nodejs-websocket');

const PORT = 3000;

// 加入棋局
const GAME_IN = 0;
// 落子
const ON_CHESS = 1;
// 广播落子了
const ON_HAS_CHESS = 2;

// 总房间数
const rooms = [];
// 用户数组
const users = [];

const server = ws.createServer(connected => {
  console.log('新建连接成功');
  connected.id = users.length + 1;
  users.push(connected.id);
  // 连接成功，下发房间数组
  connected.send(JSON.stringify({
    type: 0,
    userInfo: {id: connected.id},
    msg: '进入房间成功',
    timestamp: Date().toLocaleLowerCase(),
  }));

  connected.on('text', data=>{
    console.log('接收到数据', data);
    data = JSON.parse(data);
    if(data.type == ON_CHESS) {
      data.type = 2;
      broadcast(data);
    }
  })

  connected.on('close', (msg)=>{
    console.log("连接关闭", msg);
    // 广播退出
    // broadcastEntry(server, {
    //   type: BIND_ROOM_ID_TYPE,
    //   roomId: connected.roomId,
    //   nickname: connected.nickname,
    //   entry: 0,
    //   timestamp: Date().toLocaleLowerCase(),
    // });
  })
  connected.on('error', () => {
    console.log("处理错误连接");
  })
})

function broadcast(data) {
  server.connections.forEach(coon => {
    if(data.this_player_id != coon.id) {
      coon.send(JSON.stringify({
        ...data,
        timestamp: Date().toLocaleLowerCase(),
      }))
    }
  })
}

server.listen(PORT, ()=>{
  console.log("服务器启动成功：http://localhost:"+PORT);
})
