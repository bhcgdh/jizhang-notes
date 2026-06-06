$env:API_HOST = "127.0.0.1"
$env:API_PORT = "8001"
$env:API_MODEL_NAME = "gpt-3.5-turbo"

$llamaFactoryDir = "F:\LLaMA-Factory"
$configPath = "examples\inference\qwen3_bookkeeping_lora_sft.yaml"
$condaExe = "D:\anaconda3\Scripts\conda.exe"

Set-Location $llamaFactoryDir

if (Test-Path $condaExe) {
  & $condaExe run --no-capture-output -n qwen_ft llamafactory-cli api $configPath
} else {
  conda run --no-capture-output -n qwen_ft llamafactory-cli api $configPath
}
