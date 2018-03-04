const grpc = require('grpc');
const pollsProto = grpc.load('polls.proto');
const server = new grpc.Server();

let polls = [
  {
    id: 123, 
    question: "What is a poll question?",
    numUpvotes: 4 ,
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
  insert: (call, cb) => { 
    let poll = call.request;
    if(!isValid(poll)) return cb({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'Not found'
    });
    polls.push(poll);
    cb(null, poll)
  },
  listOne: (call, cb) => cb(null, polls.find( p => p.id === call.request.id)),
  updateOne: (call, cb) => {
    if(!call.request.id) return cb(null, {}); 

    const idKey = call.request.id;
    console.log(idKey);
    call.request.id = null;
    let poll = polls.find( p => p.id === call.request[idKey]);
    Object.keys(call.request).filter((key) => {
      console.log(key);
      return key !== null
    }).map((existingKey) => {
      console.log(existingKey);
      poll[existingKey] = call.request[existingKey + '_val'];
    });

    cb(null, poll);
  },
  deleteOne: (call, cb) => {
    if(!call.request.id) return cb({ code: grpc.status.NOT_FOUND, details: 'Not found'});
    const id = call.request.id;
    let poll = polls.find( p => p.id === id );
    if(!poll) return cb({ code: grpc.status.NOT_FOUND, details: 'NOT found'});
    polls = polls.filter( p => p.id !== id );  //lolz
    cb(null, {});
  }
});

server.bind('0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure());

console.log('Server running at http://0.0.0.0:50051');
server.start();

