// const { json } = require('express');
const bs58 = require('bs58');
require('dotenv').config();
const Pool = require('pg').Pool
const pool = new Pool({
    user: process.env.PGUSERNAME,
    host: process.env.PGHOSTNAME,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });

const insertParsedTransaction = (req) => {
    const data = req.body[0];
    console.log("resp: ", data);
    const LAMPORTS_PER_SOL = 1000000000;
    const slot = data.slot
    const blocktime = data.blockTime;
    const err = data.err;
    const fee = data.meta.fee / LAMPORTS_PER_SOL;

    console.log(`slot: ${slot}`);
    console.log(`blocktime: ${blocktime}`);
    console.log(`err: ${err}`);
    console.log(`fee: ${fee}`);
    data.transaction.message.accountKeys.map((akey, index) => {
        console.log(`accountKeys[${index}] : ${akey}`);
    });
    console.log(`header: ${JSON.stringify(data.transaction.message.header)}`);
    
    data.transaction.message.instructions.map(async (instruction, index) => {
        console.log(`instruction: ${JSON.stringify(instruction)}`);
        console.log(`instruction.data: ${instruction.data}`);
        
        if ( data.transaction.message.accountKeys[instruction.programIdIndex] == '11111111111111111111111111111111' && instruction.data.substring(0,2) == '3B') {
            console.log("we made it!")
            const program = 'system';
            // const source = data.transaction.message.accountKeys[instruction.accounts[0]].toBase58();
            // const source = bs58.encode((data.transaction.message.accountKeys[instruction.accounts[0]]).toBuffer('le', 8));
            const source = bs58.encode((new BN(data.transaction.message.accountKeys[instruction.accounts[0]]._bn, 'le')).toBuffer());
            // const destination = data.transaction.message.accountKeys[instruction.accounts[1]].toBase58();
            const destination = bs58.encode((new BN(data.transaction.message.accountKeys[instruction.accounts[1]]._bn, 'le')).toBuffer());
            // const destination = bs58.encode((data.transaction.message.accountKeys[instruction.accounts[1]]).toBuffer('le', 8));
            const lamports = Number((new Buffer((bs58.decode(instruction.data)).slice(4,12))).readBigUInt64LE());
            const decimals = 9;
            const solAmount = lamports / LAMPORTS_PER_SOL;
            const signature = data.transaction.signatures[0];
            const type = 'transfer'
    
            console.log(`${program},${type},${signature},${err},${slot},${blocktime},${fee},${source},${destination},${lamports},${decimals},${solAmount}`);
            // const insertText = 'INSERT INTO webhooks_sol_event_log(program, type, signature, err, slot, blocktime, fee, source, destination, lamports, decimals, sol_amount) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
            // await client.query(insertText, [program, type, signature, err, slot, blocktime, fee, source, destination, lamports, decimals, solAmount]);
            
            return new Promise(function(resolve, reject) {
                pool.query(`INSERT INTO webhooks_sol_event_log(program, type, signature, err, slot, blocktime, fee, source, destination, lamports, decimals, sol_amount) VALUES(${program}, ${type}, ${signature}, ${err}, ${slot}, ${blocktime}, ${fee}, ${source}, ${destination}, ${lamports}, ${decimals}, ${solAmount});`, (error, results) => {
                  if (error) {
                    reject(error)
                    console.log("insert FAILED!");
                  }
                  resolve(results.rows);
                  console.log("insert OK.");
            
                })
              });
        }
        else {
        }
    });

  // TEST INSERT TO DATABASE
  return new Promise(function(resolve, reject) {
    pool.query(`INSERT INTO hello_world(first_col) VALUES('${data.transaction.signatures[0]}')`, (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results.rows);
      console.log("insert OK");

    })
  }); 
}

const test = () => {

  return new Promise(function(resolve, reject) {
    pool.query(`select * from hello_world;`, (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results.rows);
      console.log("test OK");
    })
  }) 
}





module.exports = {
    insertParsedTransaction,
    test
  }