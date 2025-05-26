export default async function globalTeardown() {
  console.log('\n🛑 Stopping n8n container...\n');
  
  const dockerManager = (global as any).__DOCKER_MANAGER__;
  
  if (dockerManager) {
    try {
      await dockerManager.stop();
      console.log('✅ n8n container stopped successfully\n');
    } catch (error) {
      console.error('❌ Failed to stop n8n container:', error);
    }
  }
}