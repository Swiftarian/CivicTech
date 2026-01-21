"""檢查 Ollama 模型"""
import requests

try:
    response = requests.get('http://localhost:11434/api/tags', timeout=3)
    models = response.json().get('models', [])

    print(f"\n✅ Ollama AI 運行中")
    print(f"\n已安裝模型數量: {len(models)}\n")

    vision_models = []
    text_models = []

    for model in models:
        name = model.get('name', 'unknown')
        if 'vision' in name.lower():
            vision_models.append(name)
        else:
            text_models.append(name)
        print(f"  - {name}")

    print(f"\n📊 模型分類:")
    print(f"  文字模型: {len(text_models)}")
    print(f"  視覺模型: {len(vision_models)}")

    if vision_models:
        print(f"\n✅ Vision AI 可用")
        print(f"   可用模型: {', '.join(vision_models)}")
    else:
        print(f"\n🟡 Vision AI 未就緒")
        print(f"   需要安裝: ollama pull llama3.2-vision")

except requests.exceptions.ConnectionError:
    print("\n🔴 Ollama AI 未運行")
    print("   請啟動 Ollama 服務")
except Exception as e:
    print(f"\n❌ 檢查失敗: {e}")
