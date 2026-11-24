// A scheduled function: do the work, print what happened, exit.
console.log(`Ran at ${new Date().toISOString()}: ${process.env.GREETING ?? "hello"}`);
