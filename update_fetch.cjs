const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const newFetch = `
  const fetchShiftExchanges = async () => {
    if (!currentEmployee) return;
    try {
      const res = await fetch(API_BASE_URL + '/api/shift-exchanges/me/' + currentEmployee.id);
      let myExchanges = [];
      if (res.ok) {
        myExchanges = await res.json();
      }

      // If Danru, also fetch pending danru for their subdept
      let danruExchanges = [];
      const isDanru = currentEmployee.role && (currentEmployee.role.toLowerCase().includes('ketua') || currentEmployee.role.toLowerCase().includes('leader') || currentEmployee.role.toLowerCase().includes('danru'));
      
      if (isDanru && currentEmployee.subDepartmentId) {
        const resDanru = await fetch(API_BASE_URL + '/api/shift-exchanges/danru/' + currentEmployee.subDepartmentId);
        if (resDanru.ok) {
          danruExchanges = await resDanru.json();
        }
      }

      // Combine and deduplicate
      const allExchanges = [...myExchanges];
      for (const dex of danruExchanges) {
        if (!allExchanges.find(ex => ex.id === dex.id)) {
          allExchanges.push(dex);
        }
      }
      
      // Sort by createdAt desc
      allExchanges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setExchangeList(allExchanges);
    } catch (err) {
      console.error(err);
    }
  };
`;

code = code.replace(/const fetchShiftExchanges = async \(\) => \{[\s\S]*?\n  \};\n/, newFetch);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
