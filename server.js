const grpc = require('grpc');
const pollsProto = grpc.load('polls.proto');
const server = new grpc.Server();

let polls = [
  {
    id: 1, 
    question: "This is default poll",
    numUpvotes: 1,
    polleeCanAddOptions: true,
    polleeCanMultiVote: true,
    polleeCanComment: true
  }
];

function isValid(poll){
  return (poll.question !== "")
}

server.addService(pollsProto.polls.PollService.service, {
  list: (call, cb) => {
    cb(null, polls);
  },
  create: (call, cb) => { 
    let poll = call.request;
    if(!poll.question) return cb({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'You must include a poll question'
    });
   
    poll.id = polls.length+1;
    polls.push(poll);
    cb(null, poll)
  },
  find: (call, cb) => {
    const id = call.request.id;
    if(!id) return cb({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'You must include a poll id'
    });
    const poll = polls.find( p => p.id === id );
    if(!poll) return cb({
      code: grpc.status.NOT_FOUND,
      details: 'Poll not found!'
    });
    cb(null, poll)
  },
  update: (call, cb) => {
    const pollReq = call.request;
    const idKey = pollReq.idKey;
    if(!idKey) return cb({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'You must include a poll id'
    }); 
    const id = pollReq[idKey];
    let poll = polls.find(p => p.id === pollReq[idKey]); 
    if(!poll) return cb({
      code: grpc.status.NOT_FOUND,
      details: 'Poll w/ id: ' + id + ' Not found'
    })
    Object.keys(pollReq).filter((key) => {
      return key !== null && key !== 'id'
    }).map((keyName) => {
      const key = pollReq[keyName];
      poll[key] = pollReq[key]; 
    });
    console.log(poll);
    cb(null, poll);
  },
  delete: (call, cb) => {
    const pollReq = call.request;
    const idKey = pollReq.id;
    if(!idKey) return cb({ code: grpc.status.INVALID_ARGUMENT, details: 'You must include a poll id'});
    const id = pollReq[idKey + '_val'];
    let poll = polls.find( p => p.id === id );
    if(!poll) return cb({ code: grpc.status.NOT_FOUND, details: 'NOT found'});
    polls = polls.filter( p => p.id !== id );
    cb(null, {});
  }
});

server.bind('0.0.0.0:80',
  grpc.ServerCredentials.createInsecure());

console.log('Server running at http://0.0.0.0:50051');
server.start();

