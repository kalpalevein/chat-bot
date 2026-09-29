const providers = {
  anthropic: require("./anthropic"),
  openai: require("./openai"),
};

const name = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
const provider = providers[name];

if (!provider) {
  throw new Error(
    `Unknown LLM_PROVIDER "${name}". Use one of: ${Object.keys(providers).join(", ")}`
  );
}

module.exports = { streamChatCompletion: provider.streamChatCompletion };