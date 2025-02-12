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

4.可能的Owner和Manager

请注意这是owner联系列表,你需要在owner联系列表中找到可能的联系人:
Platform (Manager: Ethan Wells)
uboot: Liam Scott
bl2: Liam Scott
bl31: Liam Scott
kernel: Noah Peterson
bl30: Caleb Dawson
Storage drivers: Oliver Hayes
gpio: Henry Sutton
pinctrl: Henry Sutton
i2c: Nathan Cole
clk tree: Nathan Cole
spi: Lucas Fisher
spi nand: Lucas Fisher
spi nor flash: Lucas Fisher
pwm: Adrian Tucker
emmc: Logan Reed
sdio: Mason Bennett
WIFI/BT: Connor Jennings
wifi driver: Ryan Mitchell
wifi driver (freertos): Brandon Lee
wifi driver (buildroot): Dylan Carter
bt driver: Owen Greene
secureos: Wesley Bryant, Blake Thornton, Joel Graham
freertos: Vincent Harper
usb: Austin Brooks
ethernet phy: Evan Wallace
uart: Tyler Newton, Alex Morris

Audio (Manager: Julian Adams)
audio driver: Daniel Lawson
audio hal: Daniel Lawson
dsp driver: Justin Cooper
audio eq/drc: Sean Wright
dolby/dts MS12: Zachary Foster

Display / Graphic (Manager: Simon Grant)
OSD: Brian Porter
camera ISP: Leo Benson
Graphic: Jack Anderson
buildroot DRM: Aaron Price
NPU driver: Xavier Vaughn
NPU APP: Derek Sullivan
OSD driver: Patrick Newman
GE2D/GDC: Ian Chambers
PIP: Marcus Elliott
ISP driver: Wesley Clarke, Chase Hughes, Caleb Perkins
camera hal: Vincent Curtis
camera IQ: Ethan Greene

HDMI (Manager: Frank Dawson)
Panel Cvbs: Oliver Stone
HDMI TX: Eric Lawson
HDMI RX: Levi Baldwin, Nathan Spencer

Media (Manager: Zachary Miller)
decoder: Hugo Brooks
Android player: Maxwell Grant
DRM player: Spencer Holland, Tristan Coleman

Android AE (Manager: Taylor Young)
TV framework: Keith Simmons
CEC: Andrew Ford
camera apk: Jesse Duncan
Android System: Miles Parker

Android 公版 (Manager: Thomas Quinn)
OTT release: Wyatt Henderson
TV release: Levi Hunter
DS release: Felix Norton
system control: Oscar Bennett
burning tools: Gregory Hayes
OTA: Jordan Ellis

Buildroot (Manager: George Franklin)
RDK: Sebastian Reeves, Damian Walsh
IPC SDK: Jared Dawson, Ethan Hawkins, Russell Chapman, Bryce Sullivan, Connor Woods
ISP/encoder SDK: Preston Newman

HW (Manager: Lucas Freeman)
DDR SW: Jeremy Rhodes, Desmond Garrett
IPC HW: Cameron Tate
IPC/OTT HW: Dylan Perry
FAE HW: Adrian Foster
TV HW: Ivan Stevenson
HW: Wesley Norton
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