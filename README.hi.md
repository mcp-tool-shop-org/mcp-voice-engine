<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-voice-engine/readme.png" alt="MCP Voice Engine" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-voice-engine/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/mcp-voice-engine/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A520-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 20+">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/mcp-voice-engine?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-voice-engine/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

# MCP वॉयस इंजन

> [MCP टूल शॉप](https://mcptoolshop.com) का एक हिस्सा

यह एक नियतात्मक, स्ट्रीमिंग-आधारित प्रोसोडी इंजन है, जो अभिव्यंजक वॉयस सिंथेसिस, पिच नियंत्रण और वास्तविक समय में वॉयस ट्रांसफॉर्मेशन के लिए बनाया गया है।

## यह क्यों मौजूद है

अधिकांश वॉयस डीएसपी सिस्टम दो जगहों पर विफल होते हैं: **स्थिरता** (कंपन, झनझनाहट, नोट का कंपन) और **पुनरुत्पादन क्षमता** ("यह केवल कभी-कभी होता है")। MCP वॉयस इंजन को संगीत, कारण-आधारित और नियतात्मक होने के लिए डिज़ाइन किया गया है—इसलिए यह एक सॉफ्टवेयर की तरह व्यवहार करता है, लोककथाओं की तरह नहीं।

## आप इससे क्या बना सकते हैं

*   गेम और इंटरैक्टिव ऐप्स के लिए **वास्तविक समय में वॉयस स्टाइलिंग** (स्थिर लक्ष्य, अभिव्यंजक नियंत्रण)
*   **स्ट्रीमिंग वॉयस पाइपलाइन** (सर्वर, बॉट, लाइव प्रोसेसिंग)
*   **डीएडब्ल्यू/टूलचेन एकीकरण** (नियतात्मक पिच लक्ष्य, सुसंगत रेंडर व्यवहार)
*   **वेब ऑडियो डेमो** (ऑडियोवर्कलेट-रेडी आर्किटेक्चर)

## शुरुआत कैसे करें

```bash
npm i
npm run build
npm test
```

## मुख्य विशेषताएं

### नियतात्मक आउटपुट
समान इनपुट + कॉन्फ़िगरेशन (और चंकिंग नीति) समान आउटपुट उत्पन्न करता है, जिसमें हैश-आधारित परीक्षणों के माध्यम से रिग्रेशन सुरक्षा शामिल है।

### स्ट्रीमिंग-आधारित रनटाइम
स्टेटफुल, कारण-आधारित प्रोसेसिंग, जो कम विलंबता के लिए डिज़ाइन की गई है। कोई पश्च प्रतिपादन संपादन नहीं। निरंतरता और पुनः आरंभ करने के लिए स्नैपशॉट/पुनर्स्थापना समर्थित है।

### अभिव्यंजक प्रोसोडी नियंत्रण
इवेंट-आधारित उच्चारण और सीमा टोन आपको लय और उच्चारण को जानबूझकर आकार देने की अनुमति देते हैं—बिना पिच लक्ष्यों को अस्थिर किए।

### अर्थ परीक्षण (सिमेंटिक गार्डरेल)
परीक्षण सूट संचार व्यवहार को लागू करता है, जिसमें शामिल हैं:
*   **उच्चारण स्थानीयता** (कोई "धब्बा" नहीं)
*   **प्रश्न बनाम कथन सीमाएं** (ऊपर की ओर बढ़ना बनाम नीचे की ओर गिरना)
*   **पोस्ट-फोकस संपीड़न** (फोकस के परिणाम होते हैं)
*   **नियतात्मक इवेंट ऑर्डरिंग**
*   **शैली एकरूपता** (अभिव्यंजक > तटस्थ > सपाट, बिना अस्थिरता बढ़ाए)

## दस्तावेज़

प्राथमिक दस्तावेज़ [packages/voice-engine-dsp/docs/](packages/voice-engine-dsp/docs/) में उपलब्ध हैं।

### मुख्य दस्तावेज़

*   [स्ट्रीमिंग आर्किटेक्चर](packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
*   [मीनिंग कॉन्ट्रैक्ट](packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
*   [डीबगिंग गाइड](packages/voice-engine-dsp/docs/DEBUGGING.md)
*   [रेफरेंस हैंडबुक](Reference_Handbook.md)

### रिपॉजिटरी संरचना

`packages/voice-engine-dsp/` — कोर डीएसपी + स्ट्रीमिंग प्रोसोडी इंजन, परीक्षण और बेंचमार्क

## परीक्षण सूट चलाना

```bash
npm test
```

या विशिष्ट सूट चलाएं:

```bash
npm run test:meaning
npm run test:determinism
npm run bench:rtf
npm run smoke
```

## समर्थन

- **प्रश्न / सहायता:** [चर्चाएँ](https://github.com/mcp-tool-shop-org/mcp-voice-engine/discussions)
- **बग रिपोर्ट:** [समस्याएँ](https://github.com/mcp-tool-shop-org/mcp-voice-engine/issues)

## लाइसेंस

एमआईटी
