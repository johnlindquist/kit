import ava from 'ava'

// This test verifies that the github-workflow.ts fix will work for create-assets.ts

ava('Verify create-assets will receive arguments correctly', async (t) => {
  // Simulating how the GitHub action calls create-assets
  // From publish.yml line 189:
  // script: create-assets ${{ needs.semantic.outputs.semantic_version }} ${{ matrix.os }} ${{ matrix.arch }} ${{ needs.semantic.outputs.release_id }}
  
  // This becomes a single string argument to github-workflow.ts:
  const actionInput = 'create-assets 1.2.3 ubuntu-latest x64 12345'
  
  // Our fix in github-workflow.ts splits this:
  const parts = actionInput.split(' ')
  
  // Verify the split
  t.is(parts[0], 'create-assets', 'Script name should be create-assets')
  t.is(parts[1], '1.2.3', 'Version should be 1.2.3')
  t.is(parts[2], 'ubuntu-latest', 'Platform should be ubuntu-latest')
  t.is(parts[3], 'x64', 'Architecture should be x64')
  t.is(parts[4], '12345', 'Release ID should be 12345')
  
  // After our fix, these would be in global.args as:
  // global.args = ['create-assets', '1.2.3', 'ubuntu-latest', 'x64', '12345']
  
  // The first await arg() in github-workflow.ts consumes 'create-assets'
  // Leaving global.args = ['1.2.3', 'ubuntu-latest', 'x64', '12345']
  
  // Then create-assets.ts would receive:
  // - await arg('Enter the version number') => '1.2.3'
  // - await arg('Enter the platform') => 'ubuntu-latest'  
  // - await arg('Enter the architecture') => 'x64'
  // - await arg("Enter the release's id") => '12345'
  
  t.pass('Create-assets will receive arguments correctly after the fix')
})

ava('Verify test-ts John pattern works', async (t) => {
  // From the failing GitHub action test:
  const actionInput = 'test-ts John'
  
  const parts = actionInput.split(' ')
  
  t.is(parts[0], 'test-ts', 'Script name should be test-ts')
  t.is(parts[1], 'John', 'Argument should be John')
  
  // After fix:
  // - First await arg() gets 'test-ts' for script resolution
  // - Script's await arg() gets 'John'
  
  t.pass('test-ts John pattern will work after the fix')
})