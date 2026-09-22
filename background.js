chrome.runtime.onMessage.addListener(async (message) => {
  if (message?.type !== "ACCEPTED") return;

  const result = {
    code: message.code,
    problem: message.problem,
    receivedAt: new Date().toISOString()
  };

  await chrome.storage.local.set({
    lastAccepted: result
  });

  console.log("LeetSync captured accepted solution:", result);
});