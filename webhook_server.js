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
    const fee = data.meta.fee; // LAMPORTS_PER_SOL;
    let mint;

    console.log(`slot: ${slot}`);
    console.log(`blocktime: ${blocktime}`);
    console.log(`err: ${err}`);
    console.log(`fee: ${fee}`);
    data.transaction.message.instructions.map((instruction, index) => {
        console.log(`instruction: ${JSON.stringify(instruction)}`);
        const program = instruction.program;
        console.log(`program: ${program}`);
        console.log(`instruction.program: ${instruction.program}`);
        const signature = data.transaction.signatures[0];
        console.log(`signature: ${signature}`);        
        const recent_blockhash = data.message.recentBlockhash;
        console.log(`recent_blockhash: ${recent_blockhash}`);
        if ( program == 'system') {
            const destination = instruction.parsed.info.destination;
            const solAmount = instruction.parsed.info.lamports / LAMPORTS_PER_SOL;
            const source = instruction.parsed.info.source;
            console.log(`destination: ${destination}`);
            console.log(`solAmount: ${solAmount}`);
            console.log(`source: ${source}`);
            let type;
            try {
                type = instruction.parsed.type;
                console.log(`type: ${type}`);

            } catch {
                type = '';
            }
            // console.log(`program,type,signature,err,slot,blocktime,fee,source,destination,solAmount`);
            console.log(`${program},${type},${signature},${err},${slot},${blocktime},${fee},${source},${destination},${solAmount}`);
            return new Promise(function(resolve, reject) {
                pool.query(`INSERT INTO webhooks_sol_event_log(program, type, signature, err, slot, blocktime, fee, source, destination, sol_amount) VALUES(${program},${type},${signature},${err},${slot},${blocktime},${fee},${source},${destination},${solAmount});`, (error, results) => {
                  if (error) {
                    reject(error)
                  }
                  resolve(results.rows);
                  console.log("insert OK");
            
                })
              })
        }
        else if (program == 'spl-associated-token-account' ) {
            try {
                mint = instruction.parsed.info.mint;
            } catch {

            }
        }
        else if (program == 'spl-token') {
            let indices = [];
            const preTokenBalances = data.meta.preTokenBalances;
            const postTokenBalances = data.meta.postTokenBalances;
            for (let i in preTokenBalances) {
                indices.push(preTokenBalances[i].accountIndex)
            }
            for (let i in preTokenBalances) {
                indices.push(postTokenBalances[i].accountIndex)
            }
            let type;
            try {
                type = instruction.parsed.type;
            } catch {
                type = '';
            }
            let accountIndexFrom;
            let mintFrom;
            let ownerFrom;
            // let programIdFrom;
            let deltaFrom;
            let decimalsFrom;
            let uiDeltaFrom;
            let uiAmountPostFrom;

            let accountIndexTo;
            let mintTo;
            let ownerTo;
            // let programIdTo;
            let deltaTo;
            let decimalsTo;
            let uiDeltaTo;
            let uiAmountPostTo;


            let accountIndexPre;
            let mintPre;
            let ownerPre;
            let programIdPre;
            let amountPre;
            let decimalsPre;
            let uiAmountPre;

            let accountIndexPost;
            let mintPost;
            let ownerPost;
            let programIdPost;
            let amountPost;
            let decimalsPost;
            let uiAmountPost;

            const indicesUniq = [...new Set(indices)]
            for (let j in indicesUniq) {
                for (let i in preTokenBalances) {
                    let accountIndexTmp1 = preTokenBalances[i].accountIndex;
                    if(accountIndexTmp1 === indicesUniq[j]) {
                        accountIndexPre = accountIndexTmp1;
                        mintPre = preTokenBalances[i].mint;
                        ownerPre = preTokenBalances[i].owner;
                        programIdPre = preTokenBalances[i].programId;
                        amountPre = preTokenBalances[i].uiTokenAmount.amount;
                        decimalsPre = preTokenBalances[i].uiTokenAmount.decimals;
                        uiAmountPre = preTokenBalances[i].uiTokenAmount.uiAmount;
                    }
                }
                for (let i in postTokenBalances) {
                    let accountIndexTmp2 = postTokenBalances[i].accountIndex;
                    if(accountIndexTmp2 === indicesUniq[j]) {
                        accountIndexPost = accountIndexTmp2;
                        mintPost = postTokenBalances[i].mint;
                        ownerPost = postTokenBalances[i].owner;
                        programIdPost = postTokenBalances[i].programId;
                        amountPost = postTokenBalances[i].uiTokenAmount.amount;
                        decimalsPost = postTokenBalances[i].uiTokenAmount.decimals;
                        uiAmountPost = postTokenBalances[i].uiTokenAmount.uiAmount;
                    }
                }
                let direction = amountPost - amountPre > 0 ? 'in' : 'out';
                if (direction == 'in') {
                    accountIndexTo = accountIndexPre
                    mintTo = mintPre
                    ownerTo = ownerPre
                    deltaTo = amountPost - amountPre
                    decimalsTo = decimalsPre
                    uiDeltaTo = uiAmountPost - uiAmountPre
                    uiAmountPostTo = uiAmountPost
                } else if (direction == 'out') {
                    accountIndexFrom = accountIndexPre
                    mintFrom = mintPre
                    ownerFrom = ownerPre
                    deltaFrom = amountPost - amountPre
                    decimalsFrom = decimalsPre
                    uiDeltaFrom = uiAmountPost - uiAmountPre
                    uiAmountPostFrom = uiAmountPost
                }
            }

            // const instructions = data.transaction.message.instructions;
            // const info = instructions[0].parsed.info;
            const info = instruction.parsed.info;

    	// console.log(info);
    	// let mint;
    	let authority;
    	let destination;
    	let source;
    	let amount;
    	let decimals;
    	let uiAmount;
            authority = info.authority; 
            destination = info.destination; 
            // mint = info.mint; 
            source = info.source;

    	// try {
    	        // mint = info.mint;
    	// }
    	// catch {
    		// mint = mintTo;
    	// }
    	try {
    	        amount = info.tokenAmount.amount;
    	}
    	catch {
    		amount = deltaTo;
    	}
    	try {
    	        decimals = info.tokenAmount.decimals;
    	}
    	catch {
    		decimals = decimalsTo;
    	}
    	try {
    	        uiAmount = info.tokenAmount.uiAmount;
    	}
    	catch {
    		uiAmount = uiDeltaTo;
    	}

           if (typeof mint === 'undefined') {
               if (mintFrom !== 'undefined') {
                   mint = mintFrom;
                } else if (mintTo !== 'undefined') {
                    mint = mintTo;
                } else
                   console.log("undefined mint");
            }
    //      console.log("program,type,signature,err,slot,blocktime,fee,authority,source,uiAmountPostFrom,ownerTo,destination,uiAmountPostTo,mint,amount,decimals,uiAmount")
            console.log(`${program},${type},${signature},${err},${slot},${blocktime},${fee},${authority},${source},${uiAmountPostFrom},${ownerTo},${destination},${uiAmountPostTo},${mint},${amount},${decimals},${uiAmount}`);
        }
        else {
        }
    });

  // TEST INSERT TO DATABASE
  return new Promise(function(resolve, reject) {
    pool.query(`INSERT INTO hello_world(first_col) VALUES('${bt}')`, (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results.rows);
      console.log("insert OK");

    })
  }) 
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