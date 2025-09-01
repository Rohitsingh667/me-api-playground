(() => {
  const { useEffect, useState } = React;

  const TextInput = ({ value, onChange, placeholder, id }) => (
    React.createElement('input', { id, className: 'text-input', value, onChange: (e) => onChange(e.target.value), placeholder })
  );

  const ProfileSection = ({ profile }) => {
    if (!profile) return React.createElement('p', { className: 'muted-line' }, 'Loading profile...');
    const links = [];
    if (profile.github) links.push(React.createElement('a', { href: profile.github, target: '_blank', rel: 'noreferrer' }, 'GitHub'));
    if (profile.linkedin) links.push(React.createElement('a', { href: profile.linkedin, target: '_blank', rel: 'noreferrer' }, 'LinkedIn'));
    if (profile.portfolio) links.push(React.createElement('a', { href: profile.portfolio, target: '_blank', rel: 'noreferrer' }, 'Portfolio'));

    return React.createElement('section', { className: 'profile-panel' }, [
      React.createElement('h2', { className: 'section-title', key: 'title' }, 'Profile'),
      React.createElement('div', { className: 'profile-details', key: 'details' }, [
        React.createElement('div', { className: 'identity-row', key: 'id' }, [
          React.createElement('h3', { className: 'name-text', key: 'name' }, profile.name),
          React.createElement('p', { className: 'email-text', key: 'email' }, profile.email)
        ]),
        React.createElement('p', { className: 'education-text', key: 'edu' }, profile.education || ''),
        React.createElement('div', { className: 'links-row', key: 'links' }, links.map((l, i) => React.cloneElement(l, { key: i }))),
        React.createElement('div', { className: 'skills-grid', key: 'skills' }, (profile.skills || []).map((s, i) => (
          React.createElement('span', { className: 'skill-chip', key: `${s.name}-${i}` }, s.name)
        ))),
        React.createElement('h4', { className: 'subsection-title', key: 'proj-title' }, 'Projects'),
        React.createElement('ul', { className: 'items-list', key: 'proj-list' }, (profile.projects || []).map((p, i) => (
          React.createElement('li', { className: 'project-item', key: `${p.title}-${i}` }, [
            React.createElement('strong', { key: 't' }, p.title), ' - ', p.description || '',
            React.createElement('br', { key: 'br' }),
            React.createElement('span', { className: 'muted-line', key: 'sk' }, `Skills: ${(p.skills || []).map(s => s.name).join(', ')}`)
          ])
        )))
      ])
    ]);
  };

  const ProjectsSection = () => {
    const [skill, setSkill] = useState('');
    const [list, setList] = useState({ total: 0, items: [] });

    const onSubmit = async (e) => {
      e.preventDefault();
      const url = skill ? `/projects?skill=${encodeURIComponent(skill)}` : '/projects';
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        setList(data);
      } catch (e) {
        setList({ total: 0, items: [] });
      }
    };

    return React.createElement('section', { className: 'search-panel' }, [
      React.createElement('h2', { className: 'section-title', key: 'title' }, 'Search by Skill'),
      React.createElement('form', { className: 'skill-search-form', onSubmit: onSubmit, key: 'form' }, [
        React.createElement(TextInput, { id: 'skill-input', value: skill, onChange: setSkill, placeholder: 'e.g., React', key: 'input' }),
        React.createElement('button', { className: 'primary-button', type: 'submit', key: 'btn' }, 'Search')
      ]),
      React.createElement('div', { className: 'project-list', key: 'list' }, [
        list.items.length === 0
          ? React.createElement('p', { className: 'muted-line', key: 'empty' }, 'No projects found.')
          : React.createElement('ul', { className: 'items-list', key: 'ul' }, list.items.map((p, i) => (
              React.createElement('li', { className: 'project-item', key: `${p.title}-${i}` }, [
                React.createElement('strong', { key: 't' }, p.title), ' - ', p.description || ''
              ])
            )))
      ])
    ]);
  };

  const GlobalSearchSection = () => {
    const [q, setQ] = useState('');
    const [results, setResults] = useState(null);

    const onSubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error('Request failed');
        setResults(await res.json());
      } catch (e) {
        setResults({ projects: [], skills: [], work: [] });
      }
    };

    const content = results ? (
      (() => {
        const parts = [];
        if (results.projects && results.projects.length) {
          parts.push(React.createElement('h4', { className: 'subsection-title', key: 'p-t' }, 'Projects'));
          parts.push(React.createElement('ul', { className: 'items-list', key: 'p-l' }, results.projects.map((p, i) => (
            React.createElement('li', { className: 'project-item', key: `${p.title}-${i}` }, p.title)
          ))));
        }
        if (results.skills && results.skills.length) {
          parts.push(React.createElement('h4', { className: 'subsection-title', key: 's-t' }, 'Skills'));
          parts.push(React.createElement('div', { className: 'skills-grid', key: 's-l' }, results.skills.map((s, i) => (
            React.createElement('span', { className: 'skill-chip', key: `${s.name}-${i}` }, s.name)
          ))));
        }
        if (results.work && results.work.length) {
          parts.push(React.createElement('h4', { className: 'subsection-title', key: 'w-t' }, 'Work'));
          parts.push(React.createElement('ul', { className: 'items-list', key: 'w-l' }, results.work.map((w, i) => (
            React.createElement('li', { className: 'work-item', key: `${w.company}-${i}` }, `${w.role} @ ${w.company}`)
          ))));
        }
        return parts.length ? parts : React.createElement('p', { className: 'muted-line' }, 'No results.');
      })()
    ) : null;

    return React.createElement('section', { className: 'query-panel' }, [
      React.createElement('h2', { className: 'section-title', key: 'title' }, 'Global Search'),
      React.createElement('form', { className: 'global-search-form', onSubmit: onSubmit, key: 'form' }, [
        React.createElement(TextInput, { id: 'q-input', value: q, onChange: setQ, placeholder: 'Search projects, skills, work', key: 'input' }),
        React.createElement('button', { className: 'secondary-button', type: 'submit', key: 'btn' }, 'Go')
      ]),
      React.createElement('div', { className: 'search-results', key: 'res' }, content)
    ]);
  };

  const App = () => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
      (async () => {
        try {
          const res = await fetch('/profile');
          if (!res.ok) throw new Error('Request failed');
          setProfile(await res.json());
        } catch (e) {
          setProfile({ error: true });
        }
      })();
    }, []);

    return React.createElement(React.Fragment, null, [
      React.createElement(ProfileSection, { profile, key: 'profile' }),
      React.createElement(ProjectsSection, { key: 'projects' }),
      React.createElement(GlobalSearchSection, { key: 'search' })
    ]);
  };

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
})();
