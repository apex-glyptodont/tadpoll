const grpc = require('grpc');
const pollsProto = grpc.load('polls.proto');
const server = new grpc.Server();

let polls = [
  {
    id: { id_val: 123 }, 
    question: { question_val: "What is a poll question?" },
    numUpvotes: { numUpvotes_val: 4 },
    polleeCanAddOptions: { polleeCanAddOptions_val: true},
    polleeCanMultiVote: { polleeCanMultiVote_val: true},
    polleeCanComment: { polleeCanComment_val: true}
  }
];

server.addService(pollsProto.polls.PollService.service, {
  list: (call, cb) => {
    console.log(polls);
    cb(null, polls);
  },
  insert: (call, cb) => { polls.push(poll); cb(null, poll) },
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
  }
});

server.bind('0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure());

console.log('Server running at http://0.0.0.0:50051');
server.start();

