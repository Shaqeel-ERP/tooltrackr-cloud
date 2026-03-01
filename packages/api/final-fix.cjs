const fs = require('fs');
const path = require('path');

const replacements = {
  // tables
  'toollocations': 'tool_locations',
  'stockmovements': 'stock_movements',
  'purchaseitems': 'purchase_items',
  'transferitems': 'transfer_items',
  'toolmaintenance': 'tool_maintenance',
  'auditlog': 'audit_log',

  // columns
  'reservedquantity': 'reserved_quantity',
  'minstocklevel': 'min_stock_level',
  'maxstocklevel': 'max_stock_level',
  'lastupdated': 'last_updated',
  'updatedby': 'updated_by',
  'createdby': 'created_by',
  'fullname': 'full_name',
  'defaultlocationid': 'default_location_id',
  'lastlogin': 'last_login',
  'createdat': 'created_at',
  'updatedat': 'updated_at',
  'passwordhash': 'password_hash',
  'serialnumber': 'serial_number',
  'supplierid': 'supplier_id',
  'unitofmeasure': 'unit_of_measure',
  'locationtype': 'location_type',
  'contactinfo': 'contact_info',
  'workertype': 'worker_type',
  'toolid': 'tool_id',
  'workerid': 'worker_id',
  'locationid': 'location_id',
  'dateout': 'date_out',
  'expectedreturndate': 'expected_return_date',
  'actualreturndate': 'actual_return_date',
  'returnlocationid': 'return_location_id',
  'returncondition': 'return_condition',
  'projectcode': 'project_code',
  'jobsite': 'job_site',
  'issuedby': 'issued_by',
  'returnedto': 'returned_to',
  'fromlocationid': 'from_location_id',
  'tolocationid': 'to_location_id',
  'transferdate': 'transfer_date',
  'requestedby': 'requested_by',
  'approvedby': 'approved_by',
  'completedby': 'completed_by',
  'completedat': 'completed_at',
  'transferid': 'transfer_id',
  'requestedquantity': 'requested_quantity',
  'transferredquantity': 'transferred_quantity',
  'unitsinmaintenance': 'units_in_maintenance',
  'maintenancereason': 'maintenance_reason',
  'startedat': 'started_at',
  'expectedcompletion': 'expected_completion',
  'movementtype': 'movement_type',
  'referencetype': 'reference_type',
  'referenceid': 'reference_id',
  'unitcost': 'unit_cost',
  'totalcost': 'total_cost',
  'invoicenumber': 'invoice_number',
  'batchnumber': 'batch_number',
  'performedby': 'performed_by',
  'performedat': 'performed_at',
  'purchaseid': 'purchase_id',
  'invoicedate': 'invoice_date',
  'totalamount': 'total_amount',
  'taxamount': 'tax_amount',
  'discountamount': 'discount_amount',
  'paymentstatus': 'payment_status',
  'paymentdate': 'payment_date',
  'deliverydate': 'delivery_date',
  'receivedby': 'received_by',
  'receivedquantity': 'received_quantity',
  'expirydate': 'expiry_date',
  'entitytype': 'entity_type',
  'entityid': 'entity_id',
  'userid': 'user_id',
  'oldvalues': 'old_values',
  'newvalues': 'new_values',
  'ipaddress': 'ip_address',
  'sessionid': 'session_id'
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
