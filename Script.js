function main(config) {
  // 1. 定义 Loyalsoldier 的规则集 (Rule Providers)
  const ruleProviders = {
    "reject": {
      "type": "http",
      "behavior": "domain",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
      "path": "./ruleset/reject.yaml",
      "interval": 86400
    },
    "icloud": {
      "type": "http",
      "behavior": "domain",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
      "path": "./ruleset/icloud.yaml",
      "interval": 86400
    },
    "apple": {
      "type": "http",
      "behavior": "domain",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
      "path": "./ruleset/apple.yaml",
      "interval": 86400
    },
    "google": {
      "type": "http",
      "behavior": "domain",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
      "path": "./ruleset/google.yaml",
      "interval": 86400
    },
    "proxy": {
      "type": "http",
      "behavior": "domain",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
      "path": "./ruleset/proxy.yaml",
      "interval": 86400
    },
    "direct": {
      "type": "http",
      "behavior": "domain",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
      "path": "./ruleset/direct.yaml",
      "interval": 86400
    },
    "private": {
      "type": "http",
      "behavior": "domain",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
      "path": "./ruleset/private.yaml",
      "interval": 86400
    },
    "gfw": {
      "type": "http",
      "behavior": "domain",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
      "path": "./ruleset/gfw.yaml",
      "interval": 86400
    },
    "tld-not-cn": {
      "type": "http",
      "behavior": "domain",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
      "path": "./ruleset/tld-not-cn.yaml",
      "interval": 86400
    },
    "telegramcidr": {
      "type": "http",
      "behavior": "ipcidr",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
      "path": "./ruleset/telegramcidr.yaml",
      "interval": 86400
    },
    "cncidr": {
      "type": "http",
      "behavior": "ipcidr",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
      "path": "./ruleset/cncidr.yaml",
      "interval": 86400
    },
    "lancidr": {
      "type": "http",
      "behavior": "ipcidr",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
      "path": "./ruleset/lancidr.yaml",
      "interval": 86400
    },
    "applications": {
      "type": "http",
      "behavior": "classical",
      "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
      "path": "./ruleset/applications.yaml",
      "interval": 86400
    }
  };

  // 覆盖原配置中的 rule-providers
  config['rule-providers'] = ruleProviders;

  // 2. 智能识别代理分组名称
  const currentGroups = (config['proxy-groups'] || []).map(g => g.name);

  const findGroup = (regexList, defaultGroup) => {
    for (const regex of regexList) {
      const found = currentGroups.find(name => regex.test(name));
      if (found) return found;
    }
    return defaultGroup;
  };

  // A. 主代理分组
  const mainProxy = findGroup(
    [/节点选择/, /Proxies/i, /Proxy/i, /Global/i, /通用/], 
    currentGroups[0] 
  );

  // B. Telegram 分组
  const telegramProxy = findGroup(
    [/Telegram/i, /电报/, /TG/i], 
    mainProxy
  );

  // C. Google 分组 (包含 Gemini/NotebookLM 的逻辑)
  // 优先找 Google 分组，找不到则找 国际媒体/流媒体，最后回退到 主代理
  const googleProxy = findGroup(
    [/Google/i, /谷歌/], 
    findGroup(
        [/国际媒体/, /Media/i, /Streaming/i], 
        mainProxy 
    )
  );

  // 3. 重写规则 (Rules)
  const rules = [
    // --- 基础直连规则 ---
    "RULE-SET,applications,DIRECT",
    "DOMAIN,clash.razord.top,DIRECT",
    "DOMAIN,yacd.haishan.me,DIRECT",
    "RULE-SET,private,DIRECT",
    "RULE-SET,reject,REJECT",
    "RULE-SET,icloud,DIRECT",
    "RULE-SET,apple,DIRECT",
    
    // --- Google AI 手动补全规则 (关键修改点) ---
    // 必须放在 RULE-SET,google 之前以确保优先匹配
    `DOMAIN-SUFFIX,gemini.google.com,${googleProxy}`,
    `DOMAIN-SUFFIX,notebooklm.google,${googleProxy}`,      // NotebookLM 常用 .google 顶级域
    `DOMAIN-SUFFIX,notebooklm.google.com,${googleProxy}`,
    `DOMAIN-SUFFIX,ai.google.dev,${googleProxy}`,
    `DOMAIN-SUFFIX,aistudio.google.com,${googleProxy}`,
    `DOMAIN-SUFFIX,alkalimakersuite-pa.clients6.google.com,${googleProxy}`, // Gemini/AI 常用后端接口
    `DOMAIN-SUFFIX,generativelanguage.googleapis.com,${googleProxy}`, // 生成式 AI API
    `DOMAIN-SUFFIX,bard.google.com,${googleProxy}`, // 兼容旧域名
    `DOMAIN-SUFFIX,deepmind.com,${googleProxy}`,
    `DOMAIN-SUFFIX,deepmind.google,${googleProxy}`,
    
    // --- 规则集 ---
    // Google 规则集
    `RULE-SET,google,${googleProxy}`,
    
    // 代理列表
    `RULE-SET,proxy,${mainProxy}`,
    
    // 剩余直连
    "RULE-SET,direct,DIRECT",
    "RULE-SET,lancidr,DIRECT",
    "RULE-SET,cncidr,DIRECT",
    
    // Telegram
    `RULE-SET,telegramcidr,${telegramProxy}`,
    
    "GEOIP,LAN,DIRECT",
    "GEOIP,CN,DIRECT",
    
    // 兜底规则
    `MATCH,${mainProxy}`
  ];

  // 覆盖原配置中的 rules
  config['rules'] = rules;

  return config;
}
