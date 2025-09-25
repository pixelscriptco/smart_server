const {  Op,Sequelize } = require('sequelize');
const { Building, Tower,TowerPlan, Floor, Unit, UnitStatus, Amenity, Project, FloorPlan,UnitPlan,ProjectUpdate,Booking,User } = require('../models');

const appController = {
  async getUserProjectLocationByUrl(req, res) {
    try {
      
      const { url } = req.query;
      
      const user = await User.findOne({
        where: { url: url }
      }); 

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const projects = await Project.findAll({
        where: { user_id: user.id },
        attributes: ['id', 'name', 'url','logo', 'location', 'latitude', 'longitude','location_title','location_description','location_image'],
      });

      res.json(projects);  
    } catch (error) {
      console.error('Error getting projects:', error);
      res.status(500).json({ message: 'Error getting projects' });
    }
  },
  async getProjectBySlug(req, res) {
    try {
      const { slug } = req.params;
      const project = await Project.findOne({
        where: { url: slug }
      }); 

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project);  
    } catch (error) {
      console.error('Error getting project:', error);
      res.status(500).json({ message: 'Error getting project' });
    }
  },
  async getProjectDataBySlug(req, res) {
    try {
      const { slug } = req.params;
      const project = await Project.findOne({
        where: { url: slug }
      }); 

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const building = await Building.findOne({
         where: { project_id: project.id }
      }); 

      if (!building) {
        return res.status(404).json({ message: 'Building not found' });
      }

      const towers = await Tower.findAll({
        where: { building_id: building.id },
        attributes: ["id", "name"],
        include: [
          {
            model: Floor,
            as: 'floors',
            required: false,
            attributes: ['id', 'name']
          }
        ]
      });
      res.json(towers);  
    } catch (error) {
      console.error('Error getting project:', error);
      res.status(500).json({ message: 'Error getting project' });
    }
  },
  async getProjectDetailsBySlug(req, res){
    try {
      const { slug } = req.params;
      const project = await Project.findOne({
        where: { url: slug },
        attributes: ['project_url', 'description','location','latitude','longitude','website_link'],
        include: [
          {
            model: Amenity,
            as: 'amenities',
            required: false,
            where: { active: 1 },
            order: [
              ['id', 'ASC']
            ]
          },
          {
            model: ProjectUpdate,
            as: 'project_updates',
            required: false,
            where: { active: 1 },
            order: [
              ['id', 'ASC']
            ]
          }
        ]
      }); 

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error getting project:', error);
      res.status(500).json({ message: 'Error getting project' });
    }
  },
  async getProjectUpdatesBySlug(req, res){
    try {
      const { slug } = req.params;
      const project = await Project.findOne({
        where: { url: slug }
      }); 

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      $updates = await ProjectUpdate.findAll({
        where: { project_id: project.id }
      })

      res.json({'updates':$updates});  
    } catch (error) {
      console.error('Error getting project:', error);
      res.status(500).json({ message: 'Error getting project' });
    }
  },
  
  async getBuildingBySlug(req, res) {
    try {
      const { slug } = req.params;

      const project = await Project.findOne({
        where: { url: slug }
      }); 

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      const building = await Building.findOne({
        where: { project_id: project.id },
        order: [['created_at', 'DESC']]
      });

      if (!building) {
        return res.status(404).json({ message: 'Building not found' });
      }

      res.json(building);
    } catch (error) {
      console.error('Error getting building:', error);
      res.status(500).json({ message: 'Error getting building' });
    }
  },

  async getTowerDetails(req, res){
    try {
      const { build_id, slug } = req.params;

      const building = await Building.findOne({
        where: { id: build_id }
      });

      if (!building) {
        return res.status(404).json({ message: 'Building not found' });
      }

      const tower = await Tower.findOne({
        where: { name: slug, building_id: build_id },
        include: [
          {
            model: Floor,
            as: 'floors',
            required: false,
            include: [
              {
                model: Unit,
                as: 'units',
                required: false,
                include: [
                  {
                    model: UnitPlan,
                    as: 'unit_plans',
                    required: false,
                    attributes: ['type', 'area']
                  },
                  {
                    model: UnitStatus,
                    as: 'unit_status',
                    attributes: ['name', 'color']
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!tower) {
        return res.status(404).json({ message: 'Tower not found' });
      }
      
      // Calculate statistics
      const stats = {
        floor_count: tower.floors.length,
        total_units: 0,
        booked_units: 0,
        available_units: 0,
        unit_types: {},
        unit_areas: {}
      };
      
      tower.floors.forEach(floor => {                
        floor.units.forEach(unit => {
          stats.total_units++;
          
          // Count booked vs available units
          if (unit.unit_status.name.toLowerCase() === 'booked') {
            stats.booked_units++;
          } else if (unit.unit_status.name.toLowerCase() === 'available') {
            stats.available_units++;
          }

          // Count unit types
          if (unit.unit_plans) {
            const type = unit.unit_plans.type;
            const area = unit.unit_plans.area;
            
            if (!stats.unit_types[type]) {
              stats.unit_types[type] = 0;
            }
            stats.unit_types[type]++;

            if (!stats.unit_areas[type]) {
              stats.unit_areas[type] = area;
            }
          }
        });
      });

      // Add stats to tower data
      const towerData = {
        ...tower.toJSON(),
        stats
      };      
      
      res.json(towerData);
    } catch (error) {
      console.error('Error getting tower:', error);
      res.status(500).json({ message: 'Error getting tower' });
    }
  },

  async getUnitFilter(req, res) {
    try {
      const { tower, floor } = req.query;
      
      // Build the where clause based on the query parameters
      if (!tower) {
        return res.status(400).json({ message: 'Tower parameter is required' });  
      }
      if (!floor) {
        const floors = await Floor.findAll({
          where: { tower_id : tower },
        });
      }
      // Fetch units based on the tower and floor parameters      
      const whereClause = {};
      if (tower) {
        whereClause.tower = tower;
        const filterTower = await Tower.findOne({
          where: { name: tower }
        });
        if (!filterTower) {
          return res.status(404).json({ message: 'Tower not found' });
        }
        whereClause.tower_id = filterTower.id;
      }
      let units = [];

      if (floor) {
        const filterFloor = await Floor.findOne({
          where: { name: 'Floor-' + floor, tower_id: whereClause.tower_id }
        });

        if (!filterFloor) {
          return res.status(404).json({ message: 'Floor not found' });
        }

        units = await Unit.findAll({
          where: { floor_id: filterFloor.id },
          include: [
            {
              model: Floor, 
              as: 'floor',
              required: true,
              where: { tower_id: whereClause.tower_id },
              include: [
                {
                  model: Tower,
                  as: 'tower',
                  required: true,
                  where: { id: whereClause.tower_id }
                }
              ]
            },
            {
              model: UnitPlan,
              as: 'unit_plans',
              required: true,
              attributes: ['type', 'area', 'cost']
            },
            {
              model: UnitStatus,
              as: 'unit_status',
              required: true, 
              attributes: ['name']
            }
          ]
        });
      }else {
        const filterFloors = await Floor.findAll({
          where: { tower_id: whereClause.tower_id },
          attributes: ['id', 'name']
        });

        if (!filterFloors || filterFloors.length === 0) {
          return res.status(404).json({ message: 'No floors found for this tower' });
        }

        units = await Promise.all(
          filterFloors.map((floor) => {
            return Unit.findAll({
              where: { floor_id: floor.id },
              include: [
                {
                  model: Floor, 
                  as: 'floor',
                  required: true,
                  where: { tower_id: whereClause.tower_id },
                  include: [
                    {
                      model: Tower,
                      as: 'tower',
                      required: true,
                      where: { id: whereClause.tower_id }
                    }
                  ]
                },
                {
                  model: UnitPlan,
                  as: 'unit_plans',
                  required: true,
                  attributes: ['type', 'area', 'cost']
                },
                {
                  model: UnitStatus,
                  as: 'unit_status',
                  required: true, 
                  attributes: ['name']
                }
              ]
            });
          })
        );

        // ⚡ flatten the result since it's array of arrays
        units = units.flat();   
      }


      const unitDetails = units.map(unit => ({
        id: unit.id,
        TowerName: unit.floor.tower.name,
        FloorNumber: unit.floor.name.replace('Floor-', ''),
        FlatNumber: unit.name,
        TotalCost: unit.cost??unit.unit_plans.cost,
        SBU: unit.unit_plans.area,
        Status: unit.unit_status.name.toLowerCase(),
        UnitType: unit.unit_plans.type,
        created_at: unit.created_at,
        updated_at: unit.updated_at
      }));
      res.json({ units: unitDetails });
    } catch (error) {
      console.error('Error getting unit details:', error);
      res.status(500).json({ message: 'Error getting unit details' });
    }
  },

  async getTowerBySlug(req, res) {
    try {
      const { slug,tower_name } = req.params;

      const project = await Project.findOne({
        where: { url: slug }
      }); 

      const building = await Building.findOne({
        where: { project_id: project.id },
        order: [['created_at', 'DESC']]
      });

      if (!building) {
        return res.status(404).json({ message: 'Building not found' });
      }

      const tower = await Tower.findOne({
        where: { building_id: building.id,name: tower_name },
        include: [
          {
            model: TowerPlan,
            as: 'tower_plans',
            required: false,
            separate: true,
            order: [['order', 'ASC'], ['id', 'DESC']]
          },
          {
            model: Floor,
            as: 'floors',
            required: false,
            include: [
              {
                model: Unit,
                as: 'units',
                required: false,
                attributes: ['id', 'name', 'status'],
                order: [['id', 'ASC']]
              }
            ]
          }
        ]
      });

      if (!tower) {
        return res.status(404).json({ message: 'Tower not found' });
      }

      if (tower && tower.tower_plans?.length) {
        const plainTower = tower.toJSON();  // convert Sequelize model → plain object
        const seen = new Set();

        plainTower.tower_plans = plainTower.tower_plans.filter(tp => {
          if (seen.has(tp.order)) return false;
          seen.add(tp.order);
          return true;
        });

        // Add units summary to the response
        if (plainTower.floors) {
          const allUnits = [];
          plainTower.floors.forEach(floor => {
            if (floor.units) {
              floor.units.forEach(unit => {
                allUnits.push({
                  unit_id: unit.id,
                  status: unit.status,
                });
              });
            }
          });
          
          plainTower.units=  allUnits
        }

        return res.json(plainTower);  // send the filtered plain object
      }

      res.json(tower);
    } catch (error) {
      console.error('Error getting building:', error);
      res.status(500).json({ message: 'Error getting building' });
    }
  },

  async getInventories(req, res) {
    try {
      const { project_id } = req.params;

      // Get all units with their related data
      const units = await Unit.findAll({
        include: [
          {
            model: Floor,
            as: 'floor',
            required: true,
            include: [
              {
                model: Tower,
                as: 'tower',
                required: true,
                where: { project_id }
              }
            ]
          },
          {
            model: UnitPlan,
            as: 'unit_plans',
            required: true,
            attributes: ['type', 'area', 'price']
          },
          {
            model: UnitStatus,
            as: 'unit_status',
            required: true,
            attributes: ['name']
          }
        ]
      });

      // Transform the data into the required format
      const inventoryData = units.reduce((acc, unit) => {
        acc[unit.id] = {
          id: unit.id,
          TowerName: unit.floor.tower.name,
          FloorNumber: unit.floor.name.replace('Floor-', ''),
          FlatNumber: unit.name,
          TotalCost: unit.unit_plans.price,
          SBU: unit.unit_plans.area,
          Status: unit.unit_status.name.toLowerCase(),
          UnitType: unit.unit_plans.type,
          created_at: unit.created_at,
          updated_at: unit.updated_at
        };
        return acc;
      }, {});

      res.json(inventoryData);
    } catch (error) {
      console.error('Error getting inventories:', error);
      res.status(500).json({ message: 'Error getting inventories' });
    }
  },

  async getFloorDetails(req, res){
    try {
      const { tower_id, floor_name } = req.params;

      const tower = await Tower.findOne({
        where: { id: tower_id }
      });

      if (!tower) {
        return res.status(404).json({ message: 'Tower not found' });
      }
      
      const floor = await Floor.findOne({
        where: { name: floor_name, tower_id: tower_id },
        include: [
          {
            model: Unit,
            as: 'units',
            required: false,
            include: [
              {
                model: UnitPlan,
                as: 'unit_plans',
                required: false,
                attributes: ['type', 'area']
              }
              ,
              {
                model: UnitStatus,
                as: 'unit_status',
                required: false,
                attributes: ['name', 'color']
              }
            ]
          }
        ]
      });
      
      if (!floor) {
        return res.status(404).json({ message: 'Floor not found' });
      }
      
      // Calculate statistics
      const stats = {
        total_units: 0,
        booked_units: 0,
        available_units: 0,
        unit_types: {},
        unit_areas: {}
      };
      
      floor.units.forEach(unit => {
        stats.total_units++;
        
        // Count booked vs available units
        if (unit.unit_status.name.toLowerCase() === 'booked') {
          stats.booked_units++;
        } else if (unit.unit_status.name.toLowerCase() === 'available') {
          stats.available_units++;
        }

        // Count unit types
        if (unit.unit_plans) {
          const type = unit.unit_plans.type;
          const area = unit.unit_plans.area;
          
          if (!stats.unit_types[type]) {
            stats.unit_types[type] = 0;
          }
          stats.unit_types[type]++;

          if (!stats.unit_areas[type]) {
            stats.unit_areas[type] = area;
          }
        }
      });

      // Add stats to floor data
      const floorData = {
        ...floor.toJSON(),
        stats
      };      
      
      res.json(floorData);
    } catch (error) {
      console.error('Error getting tower:', error);
      res.status(500).json({ message: 'Error getting tower' });
    }
  },

  async getFloorBySlug(req, res) {
    try {
      const { slug,tower_name,floor_name } = req.params;

      const project = await Project.findOne({
        where: { url: slug }
      }); 

      const building = await Building.findOne({
        where: { project_id: project.id },
        order: [['created_at', 'DESC']]
      });

      if (!building) {
        return res.status(404).json({ message: 'Building not found' });
      }

      const tower = await Tower.findOne({
        where: { building_id: building.id,name: tower_name },
        order: [['created_at', 'DESC']]
      });

      if (!tower) {
        return res.status(404).json({ message: 'Tower not found' });
      }

      const floor = await Floor.findOne({
        where: { tower_id: tower.id, name: 'Floor-' + floor_name },
        include: [
          {
            model: FloorPlan,
            as: 'floor_plan',
            required: false,
          },
          {
            model: Unit,
            as: 'units',
            required: false,
            include: [
              {
                model: UnitPlan,
                as: 'unit_plans',
                required: false,
              },
              {
                model: UnitStatus,
                as: 'unit_status',
                required: false,
              }
            ]
          }
        ]
      });

      if (!floor) {
        return res.status(404).json({ message: 'Floor not found' });
      }

      res.json(floor);
    } catch (error) {
      console.error('Error getting building:', error);
      res.status(500).json({ message: 'Error getting building' });
    }
  },

   async getUnitById(req, res) {
    try {
      const { floor_id,unit_id } = req.params;

      const floor = await Floor.findOne({
        where: { id: floor_id },
        order: [['created_at', 'DESC']]
      });

      if (!floor) {
        return res.status(404).json({ message: 'Floor not found' });
      }

      const unit = await Unit.findOne({
        where: { floor_id:floor_id,name: unit_id },
        include: [
              {
                model: UnitPlan,
                as: 'unit_plans',
                required: false,
              },
              {
                model: UnitStatus,
                as: 'unit_status',
                required: false,
              }
        ]
      });

      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }

      res.json(unit);
    } catch (error) {
      console.error('Error getting unit:', error);
      res.status(500).json({ message: 'Error getting unit' });
    }
  },

  async getUnitDetails(req, res){
    try {
      const { tower_id, floor_id } = req.params;

      const tower = await Tower.findOne({
        where: { id: tower_id }
      });

      if (!tower) {
        return res.status(404).json({ message: 'Tower not found' });
      }

      const floor = await Floor.findOne({
        where: { id: floor_id },
        include: [
          {
            model: Unit,
            as: 'units',
            required: false,
            include: [
              {
                model: UnitPlan,
                as: 'unit_plans',
                required: false,
                attributes: ['type', 'area']
              },
              {
                model: UnitStatus,
                as: 'unit_status',
                attributes: ['name', 'color']
              }
            ]
          }
        ]
      });

      if (!floor) {
        return res.status(404).json({ message: 'Floor not found' });
      }
      
      // Calculate statistics
      const stats = {
        unit_count: floor.units.length,
        booked_units: 0,
        available_units: 0,
        unit_types: {},
        unit_areas: {}
      };
      
      floor.units.forEach(unit => {        
        // Count booked vs available units
        if (unit.unit_status.name.toLowerCase() === 'booked') {
          stats.booked_units++;
        } else if (unit.unit_status.name.toLowerCase() === 'available') {
          stats.available_units++;
        }

        // Count unit types
        if (unit.unit_plans) {
          const type = unit.unit_plans.type;
          const area = unit.unit_plans.area;
          
          if (!stats.unit_types[type]) {
            stats.unit_types[type] = 0;
          }
          stats.unit_types[type]++;

          if (!stats.unit_areas[type]) {
            stats.unit_areas[type] = area;
          }
        }
      });

      // Add stats to tower data
      const floorData = {
        ...floor.toJSON(),
        stats
      };      
      
      res.json(floorData);
    } catch (error) {
      console.error('Error getting tower:', error);
      res.status(500).json({ message: 'Error getting tower' });
    }
  },

  async getUnitBySlug(req, res) {
    try {
      const { slug,tower_name,floor_name,unit_name } = req.params;

      const project = await Project.findOne({
        where: { url: slug }
      }); 
      console.log('...project id.....',project.id);
      
      const building = await Building.findOne({
        where: { project_id: project.id },
        order: [['created_at', 'DESC']]
      });
      console.log('...building id.....',building.id);

      if (!building) {
        return res.status(404).json({ message: 'Building not found' });
      }

      const tower = await Tower.findOne({
        where: { building_id: building.id,name:tower_name },
        order: [['created_at', 'DESC']]
      });
      console.log('....tower id...',tower.id);
      
      if (!tower) {
        return res.status(404).json({ message: 'Tower not found' });
      }


      const floor = await Floor.findOne({
        where: { tower_id: tower.id,name:'Floor-'+floor_name },
        order: [['created_at', 'DESC']]
      });
      console.log('...floor id....',floor.id);
      if (!floor) {
        return res.status(404).json({ message: 'Floor not found' });
      }
      
      const unit = await Unit.findOne({
        where: { floor_id: floor.id,name: unit_name},
        include: [
          {
            model: UnitPlan,
            as: 'unit_plans',
            required: false
          }
        ]
      });
      console.log('....unit id.....',unit.id);
      
      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }

      res.json(unit);
    } catch (error) {
      console.error('Error getting building:', error);
      res.status(500).json({ message: 'Error getting building' });
    }
  },

  async getAmenitiesByTower(req, res){
    try {
      const { slug,tower_name } = req.params;

      const project = await Project.findOne({
        where: { url: slug }
      }); 

      const building = await Building.findOne({
        where: { project_id: project.id },
        order: [['created_at', 'DESC']]
      });

      if (!building) {
        return res.status(404).json({ message: 'Building not found' });
      }

      const tower = await Tower.findOne({
        where: { building_id: building.id,name: tower_name }
      });

      if (!tower) {
        return res.status(404).json({ message: 'Tower not found' });
      }

      const amenities = await Amenity.findAll({
        where: { tower_id: tower.id}
      })

      res.json(amenities);
    } catch (error) {
      console.error('Error getting building:', error);
      res.status(500).json({ message: 'Error getting building' });
    }
  },

  async bookUnit(req, res) {
    try {
      const { email, firstName, lastName, mobile, flatId } = req.body;
      if (!email || !firstName || !lastName || !mobile || !flatId) {
        return res.status(400).json({ message: 'Missing required fields.' });
      }

      const { project_name } = req.params;

      const project = await Project.findOne({
        where: { url: project_name }
      }); 

      // Check if the unit exists
      const unit = await Unit.findByPk(flatId);
      if (!unit) {
        return res.status(404).json({ message: 'Unit not found.' });
      }

      const status = await UnitStatus.findByPk(unit.unit_status_id);
      if (status && status.name.toLowerCase() === 'booked') {
        return res.status(400).json({ message: 'Unit is already booked.' });
      }

      // Create the booking
      const booking = await Booking.create({
        email,
        first_name: firstName,
        last_name: lastName,
        mobile,
        unit_id: flatId,
        project_id:project.id,
        status: 'pending',
      });

      // Optionally, update the unit status to 'booked'
      // await unit.update({ status: 3 });

      return res.status(201).json({ message: 'Booking successful', booking });
    } catch (error) {
      console.error('Error booking unit:', error);
      res.status(500).json({ message: 'Error booking unit' });
    }
  }

};

module.exports = appController; 