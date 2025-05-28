export default function FontTestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          AgentifUI 字体测试页面
        </h1>
        
        {/* --- BEGIN COMMENT ---
        🎯 测试所有字体变体，确保 Claude 风格字体正确加载
        --- END COMMENT --- */}
        
        {/* 默认 Sans 字体测试 */}
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">
            Sans 字体 (Inter + Noto Sans SC)
          </h2>
          <div className="space-y-4">
            <p className="font-sans text-sm">
              Small text 小号文字 - 14px
            </p>
            <p className="font-sans text-base">
              Base text 基础文字 - 16px - The quick brown fox jumps over the lazy dog. 快速的棕色狐狸跳过懒惰的狗。
            </p>
            <p className="font-sans text-lg">
              Large text 大号文字 - 18px
            </p>
            <p className="font-sans text-xl font-light">
              Extra large light 超大轻字体 - 20px
            </p>
            <p className="font-sans text-2xl font-medium">
              Heading medium 中等标题 - 24px
            </p>
            <p className="font-sans text-3xl font-semibold">
              Heading semibold 半粗标题 - 30px
            </p>
            <p className="font-sans text-4xl font-bold">
              Heading bold 粗体标题 - 36px
            </p>
          </div>
        </section>

        {/* Serif 字体测试 */}
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-green-600">
            Serif 字体 (Crimson Pro + Noto Serif SC)
          </h2>
          <div className="space-y-4">
            <p className="font-serif text-sm">
              Small serif text 小号衬线文字 - 14px
            </p>
            <p className="font-serif text-base">
              Base serif text 基础衬线文字 - 16px - The quick brown fox jumps over the lazy dog. 快速的棕色狐狸跳过懒惰的狗。这是一段用于测试衬线字体阅读效果的长文本内容。
            </p>
            <p className="font-serif text-lg">
              Large serif text 大号衬线文字 - 18px
            </p>
            <div className="font-serif text-base leading-relaxed">
              <h3 className="text-xl font-bold mb-2">阅读测试段落</h3>
              <p className="mb-4">
                这是一段用于测试 Crimson Pro 和思源宋体混合效果的长文本。The typography should feel elegant and readable, perfect for long-form content. 
                衬线字体在长文本阅读中能够提供更好的视觉引导，让读者的眼睛更容易跟随文字行进。
              </p>
              <p>
                In typography, serif fonts are characterized by small decorative strokes that extend from the main strokes of letters. 
                这些小装饰线条有助于字母之间的连接，形成更流畅的阅读体验。中文的宋体字同样具有类似的特征，
                笔画末端的装饰性处理让文字显得更加优雅和正式。
              </p>
            </div>
          </div>
        </section>

        {/* Display 字体测试 */}
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-purple-600">
            Display 字体 (Playfair Display + Noto Sans SC)
          </h2>
          <div className="space-y-4">
            <h1 className="font-display text-6xl font-bold">
              Display Title
            </h1>
            <h2 className="font-display text-4xl font-semibold">
              装饰性标题
            </h2>
            <h3 className="font-display text-3xl">
              Elegant Heading 优雅标题
            </h3>
            <p className="font-display text-xl">
              Display font for special occasions 特殊场合使用的装饰字体
            </p>
          </div>
        </section>

        {/* 混合使用测试 */}
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-orange-600">
            混合使用测试
          </h2>
          <article className="space-y-6">
            <header>
              <h1 className="font-display text-4xl font-bold mb-2">
                AgentifUI: The Future of AI Education
              </h1>
              <p className="font-sans text-lg text-gray-600">
                Published on {new Date().toLocaleDateString('zh-CN')} | 发布于今日
              </p>
            </header>
            
            <div className="font-serif text-base leading-relaxed space-y-4">
              <p>
                AgentifUI represents a revolutionary approach to AI-powered education platforms. 
                AgentifUI 代表了 AI 驱动教育平台的革命性方法。通过整合最先进的大语言模型技术，
                我们为用户提供了一个直观、强大且易于使用的界面。
              </p>
              
              <p>
                The platform seamlessly integrates multiple AI providers, including OpenAI, Anthropic, and Dify, 
                ensuring that users have access to the most advanced AI capabilities available. 
                该平台无缝集成了多个 AI 提供商，确保用户能够访问最先进的 AI 功能。
              </p>
            </div>
            
            <footer className="font-sans text-sm text-gray-500 border-t pt-4">
              <p>
                Learn more about our technology stack and implementation details. 
                了解更多关于我们的技术栈和实现细节。
              </p>
            </footer>
          </article>
        </section>

        {/* 字体加载状态检查 */}
        <section className="mb-12 p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            字体加载检查
          </h2>
          <div className="space-y-2 text-sm font-mono">
            <p>检查浏览器开发者工具的 Network 标签页，确认以下字体文件已加载：</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Inter (Google Fonts)</li>
              <li>Noto Sans SC (Google Fonts)</li>
              <li>Crimson Pro (Google Fonts)</li>
              <li>Noto Serif SC (Google Fonts)</li>
              <li>Playfair Display (Google Fonts)</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
} 