import { supabase } from '@/lib/supabase';

async function testDatabaseConnection() {
  console.log('Starting database connection test...');

  try {
    // Test Users Table
    console.log('\nTesting Users Table...');
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'staff',
      team: 'Test Team'
    };

    // Insert test user
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();

    if (insertError) throw new Error(`Error inserting user: ${insertError.message}`);
    console.log('✅ User insert successful:', insertedUser);

    // Read test user
    const { data: readUser, error: readError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@example.com')
      .single();

    if (readError) throw new Error(`Error reading user: ${readError.message}`);
    console.log('✅ User read successful:', readUser);

    // Test Shifts Table
    console.log('\nTesting Shifts Table...');
    const testShift = {
      user_id: insertedUser.id,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours later
      shift_type: 'day',
      notes: 'Test shift'
    };

    // Insert test shift
    const { data: insertedShift, error: shiftInsertError } = await supabase
      .from('shifts')
      .insert([testShift])
      .select()
      .single();

    if (shiftInsertError) throw new Error(`Error inserting shift: ${shiftInsertError.message}`);
    console.log('✅ Shift insert successful:', insertedShift);

    // Test Shift Templates Table
    console.log('\nTesting Shift Templates Table...');
    const testTemplate = {
      name: 'Test Template',
      start_time: '09:00:00',
      end_time: '17:00:00',
      shift_type: 'day',
      notes: 'Test template'
    };

    // Insert test template
    const { data: insertedTemplate, error: templateInsertError } = await supabase
      .from('shift_templates')
      .insert([testTemplate])
      .select()
      .single();

    if (templateInsertError) throw new Error(`Error inserting template: ${templateInsertError.message}`);
    console.log('✅ Template insert successful:', insertedTemplate);

    // Test Leave Requests Table
    console.log('\nTesting Leave Requests Table...');
    const testLeaveRequest = {
      user_id: insertedUser.id,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days later
      reason: 'Test leave request',
      status: 'pending'
    };

    // Insert test leave request
    const { data: insertedLeave, error: leaveInsertError } = await supabase
      .from('leave_requests')
      .insert([testLeaveRequest])
      .select()
      .single();

    if (leaveInsertError) throw new Error(`Error inserting leave request: ${leaveInsertError.message}`);
    console.log('✅ Leave request insert successful:', insertedLeave);

    // Test Shift Swap Requests Table
    console.log('\nTesting Shift Swap Requests Table...');
    const testSwapRequest = {
      shift_id: insertedShift.id,
      user_id: insertedUser.id,
      replacement_user_id: insertedUser.id, // Using same user for test
      status: 'pending',
      comment: 'Test swap request'
    };

    // Insert test swap request
    const { data: insertedSwap, error: swapInsertError } = await supabase
      .from('shift_swap_requests')
      .insert([testSwapRequest])
      .select()
      .single();

    if (swapInsertError) throw new Error(`Error inserting swap request: ${swapInsertError.message}`);
    console.log('✅ Shift swap request insert successful:', insertedSwap);

    // Clean up test data
    console.log('\nCleaning up test data...');
    await supabase.from('shift_swap_requests').delete().eq('id', insertedSwap.id);
    await supabase.from('leave_requests').delete().eq('id', insertedLeave.id);
    await supabase.from('shifts').delete().eq('id', insertedShift.id);
    await supabase.from('shift_templates').delete().eq('id', insertedTemplate.id);
    await supabase.from('users').delete().eq('id', insertedUser.id);

    console.log('✅ Test data cleanup successful');
    console.log('\n🎉 All database tests passed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  }
}

// Run the test
testDatabaseConnection().catch(console.error); 