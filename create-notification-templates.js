const axios = require('axios');
const { 
  userEventTemplates, 
  shipperEventTemplates, 
  createAllTemplates 
} = require('./notification-templates-sample');

// Configuration
const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const TEST_TOKEN = 'your-test-token-here'; // Thay bằng token thực

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

// Function to create templates with axios
async function createTemplateWithAxios(template) {
  try {
    const response = await axios.post(`${BASE_URL}/api/notification-templates`, template, { headers });
    
    if (response.data.success) {
      console.log(`✅ Created: ${template.name} (${template.event})`);
      return { success: true, template: response.data.template };
    } else {
      console.log(`❌ Failed: ${template.name} - ${response.data.message}`);
      return { success: false, error: response.data.message, template };
    }
  } catch (error) {
    console.log(`❌ Error: ${template.name} - ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message, template };
  }
}

// Function to create all templates
async function createAllTemplatesWithAxios() {
  const allTemplates = [...userEventTemplates, ...shipperEventTemplates];
  const results = [];
  
  console.log('🚀 Creating notification templates...');
  console.log(`📊 Total templates to create: ${allTemplates.length}`);
  console.log(`👤 User templates: ${userEventTemplates.length}`);
  console.log(`🚚 Shipper templates: ${shipperEventTemplates.length}`);
  console.log('');
  
  for (let i = 0; i < allTemplates.length; i++) {
    const template = allTemplates[i];
    console.log(`[${i + 1}/${allTemplates.length}] Creating: ${template.name}`);
    
    const result = await createTemplateWithAxios(template);
    results.push(result);
    
    // Add small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Function to create only user templates
async function createUserTemplates() {
  console.log('👤 Creating User Event Templates...');
  console.log(`📊 Total user templates: ${userEventTemplates.length}`);
  console.log('');
  
  const results = [];
  
  for (let i = 0; i < userEventTemplates.length; i++) {
    const template = userEventTemplates[i];
    console.log(`[${i + 1}/${userEventTemplates.length}] Creating: ${template.name}`);
    
    const result = await createTemplateWithAxios(template);
    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Function to create only shipper templates
async function createShipperTemplates() {
  console.log('🚚 Creating Shipper Event Templates...');
  console.log(`📊 Total shipper templates: ${shipperEventTemplates.length}`);
  console.log('');
  
  const results = [];
  
  for (let i = 0; i < shipperEventTemplates.length; i++) {
    const template = shipperEventTemplates[i];
    console.log(`[${i + 1}/${shipperEventTemplates.length}] Creating: ${template.name}`);
    
    const result = await createTemplateWithAxios(template);
    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Function to check existing templates
async function checkExistingTemplates() {
  try {
    console.log('🔍 Checking existing templates...');
    
    const response = await axios.get(`${BASE_URL}/api/notification-templates`, { headers });
    
    if (response.data.success) {
      const existingTemplates = response.data.templates;
      console.log(`📊 Found ${existingTemplates.length} existing templates`);
      
      const existingEvents = existingTemplates.map(t => t.event);
      const allEvents = [...userEventTemplates, ...shipperEventTemplates].map(t => t.event);
      
      const missingEvents = allEvents.filter(event => !existingEvents.includes(event));
      const existingEventsInSample = existingEvents.filter(event => allEvents.includes(event));
      
      console.log(`✅ Existing events in sample: ${existingEventsInSample.length}`);
      console.log(`❌ Missing events: ${missingEvents.length}`);
      
      if (missingEvents.length > 0) {
        console.log('Missing events:', missingEvents);
      }
      
      return {
        total: existingTemplates.length,
        existing: existingEventsInSample.length,
        missing: missingEvents.length,
        missingEvents
      };
    } else {
      console.log('❌ Failed to check existing templates');
      return null;
    }
  } catch (error) {
    console.log('❌ Error checking existing templates:', error.response?.data?.message || error.message);
    return null;
  }
}

// Function to create missing templates only
async function createMissingTemplates() {
  const checkResult = await checkExistingTemplates();
  
  if (!checkResult) {
    console.log('❌ Cannot check existing templates. Creating all templates...');
    return await createAllTemplatesWithAxios();
  }
  
  if (checkResult.missing === 0) {
    console.log('✅ All templates already exist!');
    return [];
  }
  
  console.log(`🔄 Creating ${checkResult.missing} missing templates...`);
  
  const allTemplates = [...userEventTemplates, ...shipperEventTemplates];
  const existingEvents = await getExistingEvents();
  const missingTemplates = allTemplates.filter(template => !existingEvents.includes(template.event));
  
  const results = [];
  
  for (let i = 0; i < missingTemplates.length; i++) {
    const template = missingTemplates[i];
    console.log(`[${i + 1}/${missingTemplates.length}] Creating: ${template.name}`);
    
    const result = await createTemplateWithAxios(template);
    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Helper function to get existing events
async function getExistingEvents() {
  try {
    const response = await axios.get(`${BASE_URL}/api/notification-templates`, { headers });
    
    if (response.data.success) {
      return response.data.templates.map(t => t.event);
    }
    
    return [];
  } catch (error) {
    console.log('❌ Error getting existing events:', error.message);
    return [];
  }
}

// Function to show summary
function showSummary(results) {
  console.log('\n📊 CREATION SUMMARY');
  console.log('==================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed templates:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   - ${result.template.name} (${result.template.event}): ${result.error}`);
    });
  }
  
  if (successful > 0) {
    console.log('\n✅ Successfully created templates:');
    results.filter(r => r.success).forEach(result => {
      console.log(`   - ${result.template.name} (${result.template.event})`);
    });
  }
}

// Main function
async function main() {
  console.log('🚀 Notification Templates Creator');
  console.log('================================');
  console.log(`🌐 API URL: ${BASE_URL}`);
  console.log('');
  
  // Check if token is provided
  if (TEST_TOKEN === 'your-test-token-here') {
    console.log('❌ Please update TEST_TOKEN in the script with a valid admin token');
    return;
  }
  
  // Check existing templates first
  await checkExistingTemplates();
  console.log('');
  
  // Ask user what to do
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('What would you like to do?\n1. Create all templates\n2. Create only user templates\n3. Create only shipper templates\n4. Create missing templates only\n5. Check existing templates only\nEnter your choice (1-5): ', resolve);
  });
  
  rl.close();
  
  let results = [];
  
  switch (answer) {
    case '1':
      results = await createAllTemplatesWithAxios();
      break;
    case '2':
      results = await createUserTemplates();
      break;
    case '3':
      results = await createShipperTemplates();
      break;
    case '4':
      results = await createMissingTemplates();
      break;
    case '5':
      await checkExistingTemplates();
      return;
    default:
      console.log('❌ Invalid choice. Exiting...');
      return;
  }
  
  showSummary(results);
  
  console.log('\n🎉 Template creation process completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  createAllTemplatesWithAxios,
  createUserTemplates,
  createShipperTemplates,
  createMissingTemplates,
  checkExistingTemplates,
  showSummary
};



