export const prompts = {
// 默认的日志分析 prompt
defaultLogAnalysis: `作为日志分析专家,请你分析日志,推测可能出问题的模块,根据提供的owner联系列表,推测出模块的owner和Manager(最多输出3个可能的联系人),并按照下面的模板回复：

1. 概述
- 日志类型
- 涉及组件

2. 原因分析
- 问题根源
- 关联性分析
- 系统模块定位

3. 解决方案
- 修复建议
- 预防措施

4.可能的owner和Manager

请注意这是owner联系列表,你需要在owner联系列表中找到可能的联系人:
Platform (Manager: Victor Wan)
uboot: Tao Zeng
bl2: Tao Zeng
bl31: Tao Zeng
kernel: Jianxin Pan
bl30: Qiufang Dai
Storage drivers: Yonghui Yu
gpio: Qianggui Song
pinctrl: Qianggui Song
i2c: Jian Hu
clk tree: Jian Hu
spi: Sunny Luo
spi nand: Sunny Luo
spi nor flash: Sunny Luo
pwm: Bichao Zheng
emmc: Long Yu
sdio: Liang Yang
WIFI/BT: Larson Jiang
wifi driver: Rongjun Chen
wifi driver (freertos): Bo Li
wifi driver (buildroot): Jiabin Chen
bt driver: Qiu Zeng
secureos: Peifu Jiang, Pengguang Zhu, Rui Guo
freertos: Jianxiong Pan
usb: Yue Wang
ethernet phy: Zhuo Wang
uart: Qi Duan, Yu Tu
Audio (Manager: Jian Xu)
audio driver: Shuai Li
audio hal: Shuai Li
dsp driver: Jiebin Chen
audio eq/drc: Zhe Wang
dolby/dts MS12: Yujie Wu

Display / Graphic (Manager: Simon Zheng)
OSD: Brain Zhu
camera ISP: Xiaoxin Cao
Graphic: Sky Zhou
buildroot DRM: Ao Xu
NPU driver: Xingwei Zhou
NPU APP: Deng Liu
OSD driver: Pengcheng Chen
GE2D/GDC: Jian Cao
PIP: Jintao Xu
ISP driver: Junwei Ma, Jiacheng Mei, Keke Li
camera hal: Dong Wei
camera IQ: Yu Zhang

HDMI (Manager: Frank Zhao)
Panel Cvbs: Evoke Zhang
HDMI TX: Zongdong Jiao
HDMI RX: Lei Yang, Yicheng Shen
Media (Manager: Zhi Zhou)
decoder: Hui Zhang
Android player: Lifeng Cao
DRM player: Shipeng Sun, Tao Guo

Android AE (Manager: Tellen Yu)
TV framework: Kieth Liu
CEC: An Xi
camera apk: Jie Yuan
Android System: Shuide Chen
Android 公版 (Manager: Tao Dong)
OTT release: Gongwei Chen
TV release: Lei Qian
DS release: Chunlong Cao
system control: Kaifu Hu
burning tools: Yihui Wu
OTA: Zhigang Yu

Buildroot (Manager: Guofeng Tang)
RDK: Jun Zhang, Daogao Xu
IPC SDK: Hengrui Li, Zhengyu Gao, Xuequan Feng, Yongbin He, Qiang Wei
ISP/encoder SDK: Yang Su
HW (Manager: Kun Zhang)
DDR SW: Jiaxin Ye, Zhiguang Ouyang
IPC HW: Chuanting Xu
IPC/OTT HW: Yuanyuan Li
FAE HW: Linlin Cao
TV HW: Siwei Chen
HW: Jie Feng

IT
服务器: Jia Wang, Rocky Duan
设备: Jianjun Xi, Penghui Wang
QA (Managers: Xiuyue Zhang, Ping Xiong)
Amazon: Chen Chen
OTT: Lingling Yu
IPC: Nannan Meng
`
,

// 可以添加更多的 prompts
detailedLogAnalysis: `作为日志分析专家,请详细分析以下日志：

1. 日志概述
- 日志类型和格式
- 时间范围分析
- 涉及的系统组件
- 日志严重程度分布

2. 问题诊断
- 错误模式识别
- 异常事件时序
- 系统状态分析
- 性能指标评估

3. 根因分析
- 直接原因
- 潜在因素
- 系统瓶颈
- 组件间依赖

4. 解决方案
- 即时修复建议
- 长期优化方案
- 监控建议
- 预防措施`,

// 简化版分析
simpleLogAnalysis: `简要分析此日志：
1. 问题描述
2. 原因分析
3. 解决方案`
};

// 获取单个 prompt
export function getPrompt(type = 'defaultLogAnalysis') {
    return prompts[type] || prompts.defaultLogAnalysis;
}

// 获取组合后的 prompt
export function getCombinedPrompt(type = 'defaultLogAnalysis') {
    return `${prompts.owner_prompt}\n\n${prompts[type]}`;
}

// 支持从配置文件加载
async function loadCustomPrompts() {
    try {
        const response = await fetch('/config/custom-prompts.json');
        const customPrompts = await response.json();
        // 合并自定义 prompts
        Object.assign(prompts, customPrompts);
    } catch (error) {
        console.warn('Failed to load custom prompts:', error);
    }
}

// 初始化时加载自定义 prompts
loadCustomPrompts(); 