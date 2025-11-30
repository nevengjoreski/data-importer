const API_URL = 'http://localhost:4000/api/records';

async function testRecordCreation() {
    console.log('Testing record creation...');

    const record = {
        name: 'Test User Native',
        email: 'test-native@example.com',
        company: 'Test Co Native'
    };

    // 1. Create first record
    try {
        console.log('Creating first record...');
        const res1 = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        const data1 = await res1.json();
        console.log('First Record Response:', res1.status, data1);
    } catch (error) {
        console.error('First Record Error:', error);
    }

    // 2. Try to create duplicate record
    try {
        console.log('Creating duplicate record...');
        const res2 = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        const data2 = await res2.json();
        console.log('Duplicate Record Response:', res2.status, data2);
    } catch (error) {
        console.error('Duplicate Record Error:', error);
    }

    // 3. Cleanup
    try {
        console.log('Cleaning up...');
        await fetch(API_URL, { method: 'DELETE' });
    } catch (error) {
        console.error('Cleanup Error:', error);
    }
}

testRecordCreation();
