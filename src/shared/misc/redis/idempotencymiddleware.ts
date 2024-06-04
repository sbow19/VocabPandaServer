import client from "./redisClient";

const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.body.requestId;
  
  if (!idempotencyKey) {
    return res.status(400).send({ error: 'Idempotency key is required' });
  }

  try {
    const result = await client.getAsync(idempotencyKey);
    
    if (result) {
      // Ignore the request silently if a duplicate is found
      console.log('Duplicate request ignored');
      return;
    } else if (!result){

       
        await redisClient.setAsync(idempotencyKey, 'EX', 300); // Expire after 5 minutes
        
    }
    
    next();
  } catch (error) {
    console.error('Redis error:', error);
    res.status(500).send("Internal server error"); // Proceed to the next middleware or route handler on error
  }
};

module.exports = idempotencyMiddleware;