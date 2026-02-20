export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const tracer = require('dd-trace');
    tracer.init({
      service: 'deep-environment',
      env: process.env.DD_ENV || 'hackathon',
      version: '1.0.0',
      logInjection: true,
    });
    // Enable LLM Observability — agentless ships directly to Datadog intake
    tracer.llmobs.enable({
      mlApp: 'deep-environment',
      agentlessEnabled: true,
    });
    console.log('✅ dd-trace initialized with LLM Observability (agentless)');
  }
}
