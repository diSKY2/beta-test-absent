const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// For Clock-In
content = content.replace(
  `        } else {
          setTeamAttendances(prev => prev.map(a => a.id === optimisticAtt.id ? { ...a, id: result.id } : a));
        }
      }).catch(err => {`,
  `        } else {
          setTeamAttendances(prev => prev.map(a => a.id === optimisticAtt.id ? { ...a, id: result.id } : a));
        }
        fetchEmployeeResources(true); // REFRESH DATA
      }).catch(err => {`
);

// For Clock-Out
content = content.replace(
  `          }
        } catch (err) {
          console.error(err);
          triggerToast('Sinkronisasi latar belakang gagal. Akan dicoba lagi.');
        }
      })();`,
  `          }
          fetchEmployeeResources(true); // REFRESH DATA
        } catch (err) {
          console.error(err);
          triggerToast('Sinkronisasi latar belakang gagal. Akan dicoba lagi.');
        }
      })();`
);

fs.writeFileSync('src/pages/EmployeePortal.tsx', content);
console.log('Added refresh to background syncs');
