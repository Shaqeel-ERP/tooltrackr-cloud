const fs = require('fs');
const path = require('path');

const replacements = {
    'tool_id': 'toolid',
    'location_id': 'locationid',
    'worker_id': 'workerid',
    'supplier_id': 'supplierid',
    'purchase_id': 'purchaseid',
    'transfer_id': 'transferid',
    'user_id': 'userid',
    'movement_type': 'movementtype',
    'reference_type': 'referencetype',
    'reference_id': 'referenceid',
    'unit_cost': 'unitcost',
    'total_cost': 'totalcost',
    'invoice_number': 'invoicenumber',
    'batch_number': 'batchnumber',
    'performed_by': 'performedby',
    'performed_at': 'performedat',
    'last_updated': 'lastupdated',
    'updated_by': 'updatedby',
    'created_by': 'createdby',
    'created_at': 'createdat',
    'updated_at': 'updatedat',
    'default_location_id': 'defaultlocationid',
    'serial_number': 'serialnumber',
    'min_stock_level': 'minstocklevel',
    'max_stock_level': 'maxstocklevel',
    'unit_of_measure': 'unitofmeasure',
    'location_type': 'locationtype',
    'contact_info': 'contactinfo',
    'full_name': 'fullname',
    'last_login': 'lastlogin',
    'date_out': 'dateout',
    'expected_return_date': 'expectedreturndate',
    'actual_return_date': 'actualreturndate',
    'return_location_id': 'returnlocationid',
    'return_condition': 'returncondition',
    'project_code': 'projectcode',
    'issued_by': 'issuedby',
    'returned_to': 'returnedto',
    'from_location_id': 'fromlocationid',
    'to_location_id': 'tolocationid',
    'transfer_date': 'transferdate',
    'requested_by': 'requestedby',
    'approved_by': 'approvedby',
    'completed_by': 'completedby',
    'completed_at': 'completedat',
    'units_in_maintenance': 'unitsinmaintenance',
    'maintenance_reason': 'maintenancereason',
    'started_at': 'startedat',
    'expected_completion': 'expectedcompletion',
    'invoice_date': 'invoicedate',
    'total_amount': 'totalamount',
    'tax_amount': 'taxamount',
    'discount_amount': 'discountamount',
    'payment_status': 'paymentstatus',
    'payment_date': 'paymentdate',
    'delivery_date': 'deliverydate',
    'received_by': 'receivedby',
    'received_quantity': 'receivedquantity',
    'expiry_date': 'expirydate',
    'requested_quantity': 'requestedquantity',
    'transferred_quantity': 'transferredquantity',
    'old_values': 'oldvalues',
    'new_values': 'newvalues',
    'ip_address': 'ipaddress',
    'session_id': 'sessionid',
    'entity_type': 'entitytype',
    'entity_id': 'entityid',
    'worker_type': 'workertype'
};

const dirsToScan = [
    path.join(__dirname, 'src', 'routes'),
    path.join(__dirname, 'src', 'lib')
];

let filesToProcess = [];

dirsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
            if (f.endsWith('.js')) {
                filesToProcess.push(path.join(dir, f));
            }
        });
    }
});

filesToProcess.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    for (const [wrong, correct] of Object.entries(replacements)) {
        const regex = new RegExp('\\b' + wrong + '\\b', 'g');
        content = content.replace(regex, correct);
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated ' + file);
    }
});
