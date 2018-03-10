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
    // havent updated with oneof trick to differentiate between default and unsent values..
    let poll = call.request;
    if(!isValid(poll)) return cb({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'You must include a poll question'
    });
    polls.push(poll);
    cb(null, poll)
  },
  find: (call, cb) => {
    const idKey = call.request.id;
    console.log(call.request);
    if(!idKey) return cb({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'You must include a poll id'
    });
    const id = call.request[idKey + '_val'];
    const poll = polls.find( p => p.id === id );
    if(!poll) return cb({
      code: grpc.status.NOT_FOUND,
      details: 'Poll not found!'
    });
    cb(null, poll)
  },
  update: (call, cb) => {
    const pollReq = call.request;
    const idKey = pollReq.id;
    if(idKey === null) return cb({         // this may have to change to check for null
      code: grpc.status.INVALID_ARGUMENT,
      details: 'You must include a poll id'
    }); 
    const id = pollReq[idKey + '_val'];
    pollReq.id = null;
    let poll = polls.find( p => p.id === pollReq[idKey]); 
    Object.keys(pollReq).filter((key) => {                     // only look at fields that were included in request
      console.log(key);
      return key !== null
    }).map((existingKey) => {              	    	       // update poll obj so those fields's values are updated 
      console.log(existingKey);
      poll[existingKey] = pollReq[existingKey + '_val']; 
    });

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

server.bind('0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure());

console.log('Server running at http://0.0.0.0:50051');
server.start();

