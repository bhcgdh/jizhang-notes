$env:API_HOST = "127.0.0.1"
$env:API_PORT = "8001"
$env:API_MODEL_NAME = "gpt-3.5-turbo"

conda run -n qwen_ft llamafactory-cli api F:\LLaMA-Factory\examples\inference\qwen3_bookkeeping_lora_sft.yaml
